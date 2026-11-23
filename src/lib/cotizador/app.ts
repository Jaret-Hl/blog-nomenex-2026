// Controlador del cotizador en el navegador: navegación, precios en vivo, complementos, resumen y envío.
import { actions } from "astro:actions";
import { PRECIOS, type PaqueteId, type Periodo, type Salarios } from "@/config/precios";
import { calcularCotizacion, costoComplemento, pctRazones } from "@/lib/pricing/tarifa";
import { MAX_COLABORADORES, MAX_EQUIPOS, PERIODOS, RANGOS, SALARIOS_OPC, validarContacto, type CotizacionInput } from "@/lib/quote/validacion";
import { etiquetaComplemento, fmt, normalizar, textoPeriodo } from "@/lib/cotizador/textos";

type Estado = CotizacionInput & { paso: number };
type Filtro = "todos" | "mensual" | "unico";

const CLAVE = "nomenex-cotizacion";

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T>(sel));

function el<K extends keyof HTMLElementTagNameMap>(tag: K, clase?: string, texto?: string): HTMLElementTagNameMap[K] {
  const nodo = document.createElement(tag);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

function avisar(mensaje: string, tipo: "success" | "error" = "error") {
  const w = window as unknown as { showAlert?: (m: string, t: string, d?: number) => void };
  if (typeof w.showAlert === "function") w.showAlert(mensaje, tipo);
  else alert(mensaje);
}

const acotar = (v: number, min: number, max: number, respaldo: number) =>
  Number.isFinite(v) ? Math.min(Math.max(Math.floor(v), min), max) : respaldo;

// ---------- Estado y persistencia (sessionStorage) ----------
const inicial = (): Estado => ({
  paso: 1, colaboradores: 25, razones: 1, registros: 1, salarios: "fijos", nominas: 1,
  periodo: "quincenal", asimilados: 0, periodoAsim: "mensual", paquete: null, complementos: [], equipos: 1,
});
let estado: Estado = inicial();
let filtro: Filtro = "todos";

function cargar(): Estado {
  try {
    const raw = sessionStorage.getItem(CLAVE);
    if (!raw) return inicial();
    const g = JSON.parse(raw) as Partial<Estado>;
    const ids = new Set(PRECIOS.complementos.map((c) => c.id));
    return {
      paso: acotar(Number(g.paso), 1, 4, 1),
      colaboradores: acotar(Number(g.colaboradores), 1, MAX_COLABORADORES, 25),
      razones: acotar(Number(g.razones), RANGOS.razones[0], RANGOS.razones[1], 1),
      registros: acotar(Number(g.registros), RANGOS.registros[0], RANGOS.registros[1], 1),
      salarios: (SALARIOS_OPC as string[]).includes(String(g.salarios)) ? (g.salarios as Salarios) : "fijos",
      nominas: acotar(Number(g.nominas), RANGOS.nominas[0], RANGOS.nominas[1], 1),
      periodo: (PERIODOS as string[]).includes(String(g.periodo)) ? (g.periodo as Periodo) : "quincenal",
      asimilados: acotar(Number(g.asimilados), RANGOS.asimilados[0], RANGOS.asimilados[1], 0),
      periodoAsim: (PERIODOS as string[]).includes(String(g.periodoAsim)) ? (g.periodoAsim as Periodo) : "mensual",
      paquete: g.paquete && g.paquete in PRECIOS.paquetes ? (g.paquete as PaqueteId) : null,
      complementos: Array.isArray(g.complementos) ? g.complementos.filter((id) => ids.has(id)) : [],
      equipos: acotar(Number(g.equipos), 1, MAX_EQUIPOS, 1),
    };
  } catch {
    return inicial();
  }
}

function guardar() {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    /* sin almacenamiento: el cotizador funciona igual */
  }
}

const aInput = (): CotizacionInput => {
  const { paso: _paso, ...datos } = estado;
  return datos;
};

const calc = (paquete: PaqueteId | null = estado.paquete) => calcularCotizacion({ ...aInput(), paquete: paquete ?? "basico" });

const nominasTxt = () =>
  `${estado.nominas} ${estado.nominas === 1 ? "nómina" : "nóminas"} ${textoPeriodo(estado.periodo).toLowerCase()}` +
  (estado.asimilados ? ` + ${estado.asimilados} de asimilados ${textoPeriodo(estado.periodoAsim).toLowerCase()}` : "");

/** Suma de complementos sin paquete (para la barra antes de elegir paquete). */
function sumaComplementos() {
  const sel = PRECIOS.complementos.filter((k) => estado.complementos.includes(k.id));
  const costos = sel.map((k) => ({ k, c: costoComplemento(k, estado.colaboradores, estado.equipos, estado.paquete) }));
  return {
    mensual: costos.filter((x) => x.k.tipo !== "unico").reduce((a, x) => a + x.c, 0),
    unico: costos.filter((x) => x.k.tipo === "unico").reduce((a, x) => a + x.c, 0),
  };
}

// ---------- Precios por paquete (tarjetas) ----------
function renderPlanes() {
  const n = estado.colaboradores;
  $$<HTMLElement>("[data-precio]").forEach((caja) => {
    const r = calc(caja.dataset.precio as PaqueteId);
    caja.replaceChildren();
    if (r.aMedida) {
      caja.className = "precio na";
      caja.append(el("b", "", "Cotización a la medida"), el("span", "por", "más de 200 colaboradores"));
      return;
    }
    caja.className = "precio";
    caja.append(
      el("b", "", fmt(r.subtotal)),
      document.createTextNode(" "),
      el("span", "", "al mes + IVA"),
      el("span", "por", `${fmt(r.porColaborador)} por colaborador · ${n} ${n === 1 ? "colaborador" : "colaboradores"}`)
    );
    if (n <= PRECIOS.tarifa.incluidos) {
      caja.append(el("span", "desg", `Cuota fija de 1 a ${PRECIOS.tarifa.incluidos} colaboradores`));
    }
    const partes: string[] = [];
    if (r.razones) partes.push(`razones sociales ${fmt(r.razones)}`);
    if (r.registros) partes.push(`registros patronales ${fmt(r.registros)}`);
    if (r.salarios) partes.push(`salarios variables ${fmt(r.salarios)}`);
    if (r.nominas) partes.push(`nóminas adicionales ${fmt(r.nominas)}`);
    if (r.complementosMensuales) partes.push(`complementos ${fmt(r.complementosMensuales)}`);
    if (partes.length) caja.append(el("span", "desg", `Paquete ${fmt(r.paquete)} + ${partes.join(" + ")}`));
    if (r.complementosUnicos) caja.append(el("span", "desg", `+ ${fmt(r.complementosUnicos)} de pago único`));
  });
}

// ---------- Barra de total (paso 3) ----------
function renderBarra() {
  const barra = $("#barraTotal");
  if (!barra) return;
  const comp = sumaComplementos();
  const titulo = estado.paquete ? `${PRECIOS.paquetes[estado.paquete]} + complementos` : "Complementos elegidos";
  const valor = el("span");
  if (estado.paquete) {
    const r = calc();
    if (r.aMedida) valor.textContent = "Cotización a la medida";
    else valor.append(el("b", "", fmt(r.subtotal)), document.createTextNode(" al mes + IVA"));
  } else {
    valor.append(el("b", "", fmt(comp.mensual)), document.createTextNode(" al mes + IVA"));
  }
  if (comp.unico > 0) valor.append(document.createTextNode(` · ${fmt(comp.unico)} pago único`));
  barra.replaceChildren(el("span", "", titulo), valor);
}

// ---------- Complementos (tarjetas y tabla comparativa) ----------
function renderComplementos() {
  const n = estado.colaboradores;
  const eq = estado.equipos;
  $$<HTMLElement>("[data-comp]").forEach((nodo) => {
    const on = estado.complementos.includes(nodo.dataset.comp ?? "");
    nodo.classList.toggle("sel", on);
    if (nodo.tagName === "LI") {
      nodo.setAttribute("aria-checked", String(on));
      nodo.querySelector(".bio")?.classList.toggle("on", on);
    } else {
      nodo.setAttribute("aria-pressed", String(on));
      nodo.textContent = on ? "✓ Agregado" : "+ Agregar";
    }
  });
  $$<HTMLElement>("[data-pr]").forEach((nodo) => {
    const k = PRECIOS.complementos.find((x) => x.id === nodo.dataset.pr);
    if (!k) return;
    const costo = costoComplemento(k, n, eq, estado.paquete);
    const contexto = k.tipo === "equipo" ? `${eq} equipo${eq > 1 ? "s" : ""}` : `${n} colab.`;
    nodo.replaceChildren(
      document.createTextNode(etiquetaComplemento(k, estado.paquete) + " "),
      el("small", "", `· ${fmt(costo)}${k.tipo === "unico" ? " con " : " al mes con "}${contexto}`)
    );
  });
  const bio = $<HTMLInputElement>("#bioN");
  if (bio && document.activeElement !== bio) bio.value = String(eq);
}

function filtrarComp() {
  const q = normalizar(($<HTMLInputElement>("#compBus")?.value ?? "").trim());
  let visibles = 0;
  $$<HTMLElement>("#compGrid .cg").forEach((cg) => {
    let n = 0;
    cg.querySelectorAll<HTMLElement>("li").forEach((li) => {
      const ok = (filtro === "todos" || li.dataset.tipo === filtro) && (!q || (li.dataset.txt ?? "").includes(q));
      li.style.display = ok ? "" : "none";
      if (ok) n++;
    });
    cg.style.display = n ? "" : "none";
    visibles += n;
  });
  const vacio = $("#compVacio");
  if (vacio) vacio.hidden = visibles > 0;
}

function alternarComplemento(id: string) {
  const i = estado.complementos.indexOf(id);
  if (i >= 0) estado.complementos.splice(i, 1);
  else estado.complementos.push(id);
  guardar();
  renderTodo();
}

// ---------- Controles del paso 1 ----------
function setColaboradores(valor: number | string) {
  const n = acotar(Number(valor), 1, MAX_COLABORADORES, 25);
  estado.colaboradores = n;
  const rango = $<HTMLInputElement>("#rango");
  const num = $<HTMLInputElement>("#num");
  if (rango) rango.value = String(Math.min(n, 200));
  if (num && document.activeElement !== num) num.value = String(n);
  $("#aviso200")?.classList.toggle("on", n > 200);
  guardar();
  renderTodo();
}

function campoNumerico(sel: string, prop: "razones" | "registros" | "nominas" | "asimilados", min: number, max: number) {
  const campo = $<HTMLInputElement>(sel);
  if (!campo) return;
  const fijar = (v: string) => {
    if (v === "") return;
    estado[prop] = acotar(Number(v), min, max, min);
    guardar();
    renderTodo();
  };
  campo.addEventListener("input", () => fijar(campo.value));
  campo.addEventListener("blur", () => {
    fijar(campo.value || String(min));
    campo.value = String(estado[prop]);
  });
}

// ---------- Planes ----------
function pintarPlanes() {
  $$<HTMLElement>(".plan").forEach((tarjeta) => {
    const sel = tarjeta.dataset.plan === estado.paquete;
    tarjeta.classList.toggle("activo", sel);
    tarjeta.setAttribute("aria-checked", String(sel));
    const boton = tarjeta.querySelector(".elegir");
    if (boton) boton.textContent = sel ? "Seleccionado ✓" : `Elegir ${tarjeta.dataset.nombre ?? ""}`;
  });
  const cont2 = $<HTMLButtonElement>("#cont2");
  if (cont2) cont2.disabled = !estado.paquete;
}

function elegirPaquete(id: string) {
  estado.paquete = id as PaqueteId;
  guardar();
  pintarPlanes();
  $("#avisoPaq")?.classList.remove("on");
  $$("#pasos li").forEach((li) => li.classList.remove("bloq"));
  renderTodo();
}

// ---------- Resumen (paso 4) ----------
function renderResumen() {
  const lineas = $('[data-r="lineas"]');
  const unico = $('[data-r="unico"]');
  const lista = $<HTMLUListElement>('[data-r="complementos"]');
  if (!lineas || !unico || !lista) return;

  const p = estado.paquete;
  const r = p ? calc() : null;
  const fila = (etiqueta: string, valor: string, clase = "") => {
    const d = el("div", `linea ${clase}`.trim());
    d.append(el("span", "", etiqueta), el("b", "", valor));
    return d;
  };

  const filas: HTMLElement[] = [
    fila("Paquete elegido", p ? PRECIOS.paquetes[p] : "—"),
    fila("Colaboradores", String(estado.colaboradores)),
    fila("Razones sociales", String(estado.razones)),
    fila("Registros patronales", String(estado.registros)),
    fila("Nóminas", nominasTxt()),
  ];
  if (r && !r.aMedida) {
    const pct = Math.round(pctRazones(estado.razones) * 100);
    filas.push(fila("Paquete", fmt(r.paquete)));
    if (r.razones) filas.push(fila(`Razones sociales adicionales (+${pct}%)`, fmt(r.razones)));
    if (r.registros) filas.push(fila(`Registros patronales adicionales (${estado.registros - PRECIOS.registros.incluidos})`, fmt(r.registros)));
    if (r.salarios) filas.push(fila(`Salarios variables o mixtos (+${Math.round(PRECIOS.salarios.variables * 100)}%)`, fmt(r.salarios)));
    if (r.nominas) filas.push(fila(`Nóminas adicionales (${estado.nominas - PRECIOS.nominas.incluidas + estado.asimilados})`, fmt(r.nominas)));
    filas.push(fila("Complementos mensuales", fmt(r.complementosMensuales)), fila("Subtotal mensual", fmt(r.subtotal)), fila("IVA 16%", fmt(r.iva)));
  }
  const total = el("div", "linea tot");
  total.append(el("span", "", "Total mensual"), el("span", "", !p ? "—" : r?.aMedida ? "A la medida" : fmt(r!.totalMensual)));
  lineas.replaceChildren(...filas, total);

  unico.replaceChildren();
  if (r && r.complementosUnicos > 0) {
    const totalUnico = el("div", "linea tot");
    totalUnico.style.fontSize = "17px";
    totalUnico.append(el("span", "", "Total pago único"), el("span", "", fmt(r.totalUnico)));
    unico.append(fila("Accesorios de pago único", fmt(r.complementosUnicos)), fila("IVA 16%", fmt(r.ivaUnico)), totalUnico);
  }

  const porColab = $('[data-r="porColab"]');
  if (porColab) porColab.textContent = r && !r.aMedida ? fmt(r.porColaborador) : "—";

  lista.replaceChildren();
  const detalle = r?.detalle ?? [];
  if (!detalle.length) lista.append(el("li", "", "Ninguno seleccionado"));
  detalle.forEach((c) => {
    const nombre = c.id === "bio" ? `${c.nombre} (${estado.equipos} equipo${estado.equipos > 1 ? "s" : ""})` : c.nombre;
    const item = el("li");
    item.append(el("span", "", nombre), el("span", "", `${fmt(c.costo)}${c.tipo === "unico" ? " pago único" : " /mes"}`));
    lista.append(item);
  });

  const vig = new Date();
  vig.setDate(vig.getDate() + PRECIOS.tarifa.vigenciaDias);
  const vigencia = $('[data-r="vigencia"]');
  if (vigencia) {
    vigencia.textContent =
      `Cotización vigente ${PRECIOS.tarifa.vigenciaDias} días naturales: hasta el ` +
      vig.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) +
      `. Importes mensuales redondeados a múltiplos de $${PRECIOS.tarifa.redondeo}.`;
  }
}

// ---------- Render general ----------
function renderTodo() {
  $("#nTxt")?.replaceChildren(document.createTextNode(String(estado.colaboradores)));
  const per = $("#perTxt");
  if (per) per.textContent = textoPeriodo(estado.periodo).toLowerCase();
  renderPlanes();
  renderBarra();
  renderComplementos();
  filtrarComp();
  if (estado.paso === 4) renderResumen();
}

// ---------- Navegación ----------
function ir(p: number, desplazar = true) {
  let destino = p;
  const aviso = $("#avisoPaq");
  if (destino >= 3 && !estado.paquete) {
    destino = 2;
    aviso?.classList.add("on");
  } else {
    aviso?.classList.remove("on");
  }
  estado.paso = destino;
  guardar();
  $$<HTMLElement>(".vista").forEach((v) => v.classList.toggle("on", Number(v.dataset.v) === destino));
  $$<HTMLElement>("#pasos li").forEach((li) => {
    const k = Number(li.dataset.p);
    li.classList.toggle("on", k === destino);
    li.classList.toggle("ok", k < destino);
    li.classList.toggle("bloq", k >= 3 && !estado.paquete);
    const boton = li.querySelector("button");
    if (boton) {
      if (k === destino) boton.setAttribute("aria-current", "step");
      else boton.removeAttribute("aria-current");
    }
  });
  if (destino === 4) renderResumen();
  if (desplazar) window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Formulario y agenda ----------
function leerContacto(form: HTMLFormElement) {
  const datos = new FormData(form);
  return {
    nombre: String(datos.get("nombre") ?? ""),
    empresa: String(datos.get("empresa") ?? ""),
    correo: String(datos.get("correo") ?? ""),
    telefono: String(datos.get("telefono") ?? ""),
    privacidad: datos.get("privacidad") === "on",
  };
}

function mostrarErrores(errores: Partial<Record<string, string>>, campos: string[]) {
  $$<HTMLElement>("[data-error]").forEach((nodo) => {
    const clave = nodo.dataset.error ?? "";
    if (campos.includes(clave)) nodo.textContent = errores[clave] ?? "";
  });
}

function limpiarErrores() {
  $$<HTMLElement>("[data-error]").forEach((nodo) => (nodo.textContent = ""));
  const fErr = $("#fErr");
  if (fErr) fErr.textContent = "";
}

function bindFormulario() {
  const form = $<HTMLFormElement>("#form");
  const btnEnviar = $<HTMLButtonElement>("#btnEnviar");
  const fErr = $("#fErr");
  const fOk = $("#fOk");
  if (!form || !btnEnviar || !fErr || !fOk) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    limpiarErrores();
    fOk.classList.remove("on");

    const v = validarContacto(leerContacto(form));
    if (!v.ok) {
      mostrarErrores(v.errores, ["nombre", "empresa", "correo", "telefono", "privacidad"]);
      fErr.textContent = "Revisa los datos marcados en rojo.";
      return;
    }
    if (!estado.paquete) {
      avisar("Elige un paquete antes de enviar tu cotización.");
      ir(2);
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando...";
    let enviada = false;
    try {
      const website = String(new FormData(form).get("website") ?? "");
      const res = await actions.sendQuote({
        cotizacion: aInput(),
        contacto: v.valor,
        website,
        captcha: String(new FormData(form).get("cf-turnstile-response") ?? ""),
      });
      if (res.error) {
        fErr.textContent = res.error.message || "No pudimos enviar tu cotización. Intenta de nuevo.";
        return;
      }
      const folio = res.data?.folio;
      enviada = true;
      fOk.textContent = folio
        ? `Listo. Enviamos tu cotización a ${v.valor.correo}. Folio: ${folio}.`
        : `Listo. Enviamos tu cotización a ${v.valor.correo}.`;
      fOk.classList.add("on");
      if (res.data?.message) fOk.textContent = res.data.message;
      btnEnviar.textContent = "Cotización enviada";
    } catch (error) {
      console.error("[cotizador] Error al enviar:", error);
      fErr.textContent = "Error inesperado. Intenta de nuevo.";
    } finally {
      if (!enviada) {
        btnEnviar.disabled = false;
        btnEnviar.textContent = "Enviar cotización";
      }
    }
  });

  $("#abrirAgenda")?.addEventListener("click", () => {
    const v = validarContacto(leerContacto(form));
    limpiarErrores();
    if (v.errores.nombre || v.errores.correo) {
      mostrarErrores(v.errores, ["nombre", "correo"]);
      fErr.textContent = "Completa tu nombre y correo para agendar.";
      return;
    }
    const w = window as unknown as {
      openBookingModal?: (d: { name: string; email: string; company?: string; phone?: string }) => void;
    };
    if (typeof w.openBookingModal !== "function") {
      avisar("No se pudo abrir la agenda. Recarga la página e intenta de nuevo.");
      return;
    }
    w.openBookingModal({ name: v.valor.nombre, email: v.valor.correo, company: v.valor.empresa, phone: v.valor.telefono });
  });
}

// ---------- Vinculación de eventos ----------
function sincronizarControles() {
  const set = (sel: string, valor: string | number) => {
    const c = $<HTMLInputElement | HTMLSelectElement>(sel);
    if (c) c.value = String(valor);
  };
  set("#num", estado.colaboradores);
  set("#rango", Math.min(estado.colaboradores, 200));
  set("#razones", estado.razones);
  set("#regs", estado.registros);
  set("#salarios", estado.salarios);
  set("#nominas", estado.nominas);
  set("#periodo", estado.periodo);
  set("#asim", estado.asimilados);
  set("#periodoAsim", estado.periodoAsim);
  $("#aviso200")?.classList.toggle("on", estado.colaboradores > 200);
}

function bindEventos() {
  $$<HTMLElement>("[data-ir]").forEach((b) => b.addEventListener("click", () => ir(Number(b.dataset.ir))));
  $$<HTMLElement>("#pasos li").forEach((li) =>
    li.querySelector("button")?.addEventListener("click", () => ir(Number(li.dataset.p)))
  );

  // Paso 1
  const rango = $<HTMLInputElement>("#rango");
  const num = $<HTMLInputElement>("#num");
  rango?.addEventListener("input", () => setColaboradores(rango.value));
  num?.addEventListener("input", () => { if (num.value) setColaboradores(num.value); });
  num?.addEventListener("blur", () => setColaboradores(num.value || 1));
  campoNumerico("#razones", "razones", RANGOS.razones[0], RANGOS.razones[1]);
  campoNumerico("#regs", "registros", RANGOS.registros[0], RANGOS.registros[1]);
  campoNumerico("#nominas", "nominas", RANGOS.nominas[0], RANGOS.nominas[1]);
  campoNumerico("#asim", "asimilados", RANGOS.asimilados[0], RANGOS.asimilados[1]);
  $<HTMLSelectElement>("#salarios")?.addEventListener("change", (e) => {
    estado.salarios = (e.target as HTMLSelectElement).value as Salarios;
    guardar();
    renderTodo();
  });
  $<HTMLSelectElement>("#periodo")?.addEventListener("change", (e) => {
    estado.periodo = (e.target as HTMLSelectElement).value as Periodo;
    guardar();
    renderTodo();
  });
  $<HTMLSelectElement>("#periodoAsim")?.addEventListener("change", (e) => {
    estado.periodoAsim = (e.target as HTMLSelectElement).value as Periodo;
    guardar();
    renderTodo();
  });

  // Paquetes
  $$<HTMLElement>(".plan").forEach((tarjeta) => {
    tarjeta.addEventListener("click", () => elegirPaquete(tarjeta.dataset.plan ?? ""));
    tarjeta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        elegirPaquete(tarjeta.dataset.plan ?? "");
      }
    });
  });
  const toggle = $<HTMLButtonElement>(".toggle");
  const tabla = $<HTMLElement>("#tabla");
  toggle?.addEventListener("click", () => {
    if (!tabla) return;
    const mostrar = tabla.hidden;
    tabla.hidden = !mostrar;
    toggle.setAttribute("aria-expanded", String(mostrar));
    toggle.textContent = mostrar ? "Ocultar comparativo" : "Ver comparativo completo";
  });

  // Complementos: un solo listener para tarjetas (li), botones de la tabla y equipos
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const boton = t.closest<HTMLElement>("button[data-comp]");
    if (boton) return alternarComplemento(boton.dataset.comp ?? "");
    const li = t.closest<HTMLElement>("li[data-comp]");
    if (li && !t.closest("input, label")) alternarComplemento(li.dataset.comp ?? "");
  });
  document.addEventListener("keydown", (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>("li[data-comp]");
    if (li && (e.key === "Enter" || e.key === " ") && e.target === li) {
      e.preventDefault();
      alternarComplemento(li.dataset.comp ?? "");
    }
  });
  document.addEventListener("input", (e) => {
    const campo = e.target as HTMLInputElement;
    if (campo.id === "bioN") {
      estado.equipos = acotar(Number(campo.value), 1, MAX_EQUIPOS, 1);
      guardar();
      renderTodo();
    }
  });

  // Filtros y búsqueda del paso 3
  $<HTMLInputElement>("#compBus")?.addEventListener("input", filtrarComp);
  $$<HTMLButtonElement>("#compFiltros button").forEach((b) =>
    b.addEventListener("click", () => {
      filtro = (b.dataset.f ?? "todos") as Filtro;
      $$<HTMLButtonElement>("#compFiltros button").forEach((x) => {
        const sel = x === b;
        x.classList.toggle("sel", sel);
        x.setAttribute("aria-pressed", String(sel));
      });
      filtrarComp();
    })
  );

  // Agenda desde el encabezado: lleva al resumen y enfoca el formulario
  $("#ctaAgenda")?.addEventListener("click", (e) => {
    e.preventDefault();
    ir(4);
    $<HTMLInputElement>("#fNom")?.focus();
  });

  bindFormulario();
}

let vinculado = false;

export function initCotizador() {
  if (!vinculado) {
    vinculado = true;
    bindEventos();
  }
  estado = cargar();
  sincronizarControles();
  pintarPlanes();
  renderTodo();
  ir(location.hash === "#resumen" ? 4 : estado.paso, location.hash !== "#resumen");
}
