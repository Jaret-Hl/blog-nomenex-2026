// Controlador del cotizador en el navegador: navegación, precios en vivo, complementos, resumen y envío.
import { actions } from "astro:actions";
import { PRECIOS, type PaqueteId } from "@/config/precios";
import { calcularComplementos, costoComplemento } from "@/lib/pricing/complementos";
import { porcentajeSedes } from "@/lib/pricing/sedes";
import { cotizar, cotizarPaquete } from "@/lib/quote/mapeo";
import {
  MAX_COLABORADORES,
  MAX_EQUIPOS,
  SEDES_OPCIONES,
  validarContacto,
  type CotizacionInput,
} from "@/lib/quote/validacion";
import { SEDES_CORTO, etiquetaComplemento, fmt } from "@/lib/cotizador/textos";

interface Estado extends CotizacionInput {
  paso: number;
}

const CLAVE = "nomenex-cotizacion";
const IVA = PRECIOS.iva;

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

// ---------- Estado y persistencia (sessionStorage: sobrevive a recargas y al paso por la agenda) ----------
const estadoInicial = (): Estado => ({ paso: 1, colaboradores: 25, sedes: "1", paquete: null, complementos: [], equipos: 1 });
let estado: Estado = estadoInicial();

function cargarEstado(): Estado {
  try {
    const raw = sessionStorage.getItem(CLAVE);
    if (!raw) return estadoInicial();
    const g = JSON.parse(raw) as Partial<Estado>;
    const ids = new Set(PRECIOS.complementos.map((c) => c.id));
    const paquete = (g.paquete && g.paquete in PRECIOS.paquetes ? g.paquete : null) as PaqueteId | null;
    return {
      paso: acotar(Number(g.paso), 1, 4, 1),
      colaboradores: acotar(Number(g.colaboradores), 1, MAX_COLABORADORES, 25),
      sedes: (SEDES_OPCIONES as readonly string[]).includes(String(g.sedes)) ? String(g.sedes) : "1",
      paquete,
      complementos: Array.isArray(g.complementos) ? g.complementos.filter((id) => ids.has(id)) : [],
      equipos: acotar(Number(g.equipos), 1, MAX_EQUIPOS, 1),
    };
  } catch {
    return estadoInicial();
  }
}

function guardar() {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    /* almacenamiento no disponible: el cotizador funciona igual */
  }
}

const aInput = (): CotizacionInput => ({
  colaboradores: estado.colaboradores,
  sedes: estado.sedes,
  paquete: estado.paquete,
  complementos: estado.complementos,
  equipos: estado.equipos,
});

// ---------- Precios por paquete (tarjetas) ----------
function renderPrecios() {
  const n = estado.colaboradores;
  $$<HTMLElement>("[data-precio]").forEach((caja) => {
    const id = caja.dataset.precio as PaqueteId;
    const q = cotizarPaquete(aInput(), id);
    caja.replaceChildren();

    if (q.aMedida || !q.breakdown) {
      caja.className = "precio na";
      caja.append(el("b", "", "Cotización a la medida"), el("span", "por", "más de 200 colaboradores"));
      return;
    }

    const b = q.breakdown;
    caja.className = "precio";
    caja.append(
      el("b", "", fmt(b.subtotal)),
      document.createTextNode(" "),
      el("span", "", "al mes + IVA"),
      el("span", "por", `${fmt(b.subtotal / n)} por colaborador · ${n} ${n === 1 ? "colaborador" : "colaboradores"}`)
    );

    const partes: string[] = [];
    if (b.sedes > 0) partes.push(`sedes ${fmt(b.sedes)} (${Math.round(porcentajeSedes(Number(estado.sedes)) * 100)}%)`);
    if (b.complementosMensuales > 0) partes.push(`complementos ${fmt(b.complementosMensuales)}`);
    if (partes.length) caja.append(el("span", "desg", `Paquete ${fmt(b.paquete)} + ${partes.join(" + ")}`));
    if (b.complementosUnicos > 0) caja.append(el("span", "desg", `+ ${fmt(b.complementosUnicos)} pago único de consultoría`));
  });
}

// ---------- Barra de total (paso 3) ----------
function renderBarra() {
  const barra = $("#barraTotal");
  if (!barra) return;
  const comp = calcularComplementos(estado.complementos, estado.colaboradores, estado.equipos);

  const titulo = estado.paquete
    ? `${PRECIOS.paquetes[estado.paquete].nombre}${porcentajeSedes(Number(estado.sedes)) ? " + sedes" : ""} + complementos`
    : "Complementos elegidos";

  const valor = el("span");
  if (estado.paquete) {
    const q = cotizar(aInput());
    if (q.aMedida || !q.breakdown) valor.textContent = "Cotización a la medida";
    else valor.append(el("b", "", fmt(q.breakdown.subtotal)), document.createTextNode(" al mes + IVA"));
  } else {
    valor.append(el("b", "", fmt(comp.mensual)), document.createTextNode(" al mes + IVA"));
  }
  if (comp.unico > 0) valor.append(document.createTextNode(` · ${fmt(comp.unico)} pago único`));

  barra.replaceChildren(el("span", "", titulo), valor);
}

// ---------- Complementos (tarjetas y tabla comparativa) ----------
function renderComplementos() {
  const n = estado.colaboradores;
  const equipos = estado.equipos;

  $$<HTMLElement>("[data-comp]").forEach((nodo) => {
    const id = nodo.dataset.comp ?? "";
    const on = estado.complementos.includes(id);
    if (nodo.tagName === "LI") {
      nodo.classList.toggle("sel", on);
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
    const costo = costoComplemento(k, n, equipos);
    const contexto = k.tipo === "equipo" ? `${equipos} equipo${equipos > 1 ? "s" : ""}` : `${n} colab.`;
    nodo.replaceChildren(
      document.createTextNode(etiquetaComplemento(k) + " "),
      el("small", "", `· ${fmt(costo)}${k.tipo === "unico" ? " con " : " al mes con "}${contexto}`)
    );
  });

  const bio = $<HTMLInputElement>("#bioN");
  if (bio && document.activeElement !== bio) bio.value = String(equipos);
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
  if (num && num.value !== String(n) && document.activeElement !== num) num.value = String(n);
  $("#aviso200")?.classList.toggle("on", n > 200);
  const nTxt = $("#nTxt");
  if (nTxt) nTxt.textContent = String(n);
  guardar();
  renderTodo();
}

function renderSedes() {
  const pct = Math.round(porcentajeSedes(Number(estado.sedes)) * 100);
  const chip = $("#sedesTxt");
  if (chip) {
    chip.textContent = pct
      ? `${SEDES_CORTO[estado.sedes]} sedes: +${pct}% sobre el precio del paquete`
      : "Una sede: sin cargo adicional";
  }
}

// ---------- Planes ----------
function pintarPlanes() {
  $$<HTMLElement>(".plan").forEach((tarjeta) => {
    const seleccionado = tarjeta.dataset.plan === estado.paquete;
    tarjeta.classList.toggle("activo", seleccionado);
    tarjeta.setAttribute("aria-checked", String(seleccionado));
    const boton = tarjeta.querySelector(".elegir");
    if (boton) boton.textContent = seleccionado ? "Seleccionado ✓" : `Elegir ${tarjeta.dataset.nombre ?? ""}`;
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
function setR(clave: string, texto: string) {
  $$<HTMLElement>(`[data-r="${clave}"]`).forEach((nodo) => (nodo.textContent = texto));
}

function linea(etiqueta: string, valor: string): HTMLElement {
  const fila = el("div", "linea");
  fila.append(el("span", "", etiqueta), el("b", "", valor));
  return fila;
}

function renderResumen() {
  const n = estado.colaboradores;
  const equipos = estado.equipos;
  const comp = calcularComplementos(estado.complementos, n, equipos);
  const pct = porcentajeSedes(Number(estado.sedes));

  setR("paquete", estado.paquete ? PRECIOS.paquetes[estado.paquete].nombre : "—");
  setR("colaboradores", String(n));
  setR("sedes", SEDES_CORTO[estado.sedes] ?? estado.sedes);
  setR("sedesTxt", `Sedes adicionales (+${Math.round(pct * 100)}%)`);
  $("#rSedLin")?.style.setProperty("display", pct ? "" : "none");

  const q = estado.paquete ? cotizar(aInput()) : null;
  if (!q || q.aMedida || !q.breakdown) {
    ["paqueteP", "sedesP", "sub", "iva", "total", "porColab"].forEach((k) => setR(k, estado.paquete ? "A la medida" : "—"));
    setR("compP", fmt(comp.mensual));
  } else {
    const b = q.breakdown;
    setR("paqueteP", fmt(b.paquete));
    setR("sedesP", fmt(b.sedes));
    setR("compP", fmt(b.complementosMensuales));
    setR("sub", fmt(b.subtotal));
    setR("iva", fmt(b.iva));
    setR("total", fmt(b.totalMensual));
    setR("porColab", fmt(b.subtotal / n));
  }

  const lista = $<HTMLUListElement>('[data-r="complementos"]');
  if (lista) {
    lista.replaceChildren();
    if (!comp.detalle.length) lista.append(el("li", "", "Ninguno seleccionado"));
    comp.detalle.forEach((c) => {
      const nombre = c.id === "bio" ? `${c.nombre} (${equipos} equipo${equipos > 1 ? "s" : ""})` : c.nombre;
      const item = el("li");
      item.append(el("span", "", nombre), el("span", "", `${fmt(c.costo)}${c.tipo === "unico" ? " pago único" : " /mes"}`));
      lista.append(item);
    });
  }

  const unico = $('[data-r="unico"]');
  if (unico) {
    unico.replaceChildren();
    if (comp.unico > 0) {
      const iva = comp.unico * IVA;
      unico.append(
        linea("Pago único de consultoría", fmt(comp.unico)),
        linea("IVA 16%", fmt(iva)),
        (() => {
          const total = el("div", "linea tot");
          total.style.fontSize = "17px";
          total.append(el("span", "", "Total pago único"), el("span", "", fmt(comp.unico + iva)));
          return total;
        })()
      );
    }
  }
}

// ---------- Render general ----------
function renderTodo() {
  renderSedes();
  renderPrecios();
  renderBarra();
  renderComplementos();
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
    w.openBookingModal({
      name: v.valor.nombre,
      email: v.valor.correo,
      company: v.valor.empresa,
      phone: v.valor.telefono,
    });
  });
}

// ---------- Vinculación de eventos ----------
function sincronizarControles() {
  const rango = $<HTMLInputElement>("#rango");
  const num = $<HTMLInputElement>("#num");
  const sedes = $<HTMLSelectElement>("#sedes");
  if (rango) rango.value = String(Math.min(estado.colaboradores, 200));
  if (num) num.value = String(estado.colaboradores);
  if (sedes) sedes.value = estado.sedes;
  $("#aviso200")?.classList.toggle("on", estado.colaboradores > 200);
  const nTxt = $("#nTxt");
  if (nTxt) nTxt.textContent = String(estado.colaboradores);
}

function bindEventos() {
  $$<HTMLElement>("[data-ir]").forEach((b) => b.addEventListener("click", () => ir(Number(b.dataset.ir))));
  $$<HTMLElement>("#pasos li").forEach((li) =>
    li.querySelector("button")?.addEventListener("click", () => ir(Number(li.dataset.p)))
  );

  const rango = $<HTMLInputElement>("#rango");
  const num = $<HTMLInputElement>("#num");
  rango?.addEventListener("input", () => setColaboradores(rango.value));
  num?.addEventListener("input", () => {
    if (num.value) setColaboradores(num.value);
  });
  num?.addEventListener("blur", () => setColaboradores(num.value || 1));

  $<HTMLSelectElement>("#sedes")?.addEventListener("change", (e) => {
    estado.sedes = (e.target as HTMLSelectElement).value;
    guardar();
    renderTodo();
  });

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

  // Un solo listener para complementos: tarjetas (li), botones de la tabla y el campo de equipos
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const boton = t.closest<HTMLElement>("button[data-comp]");
    if (boton) {
      alternarComplemento(boton.dataset.comp ?? "");
      return;
    }
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

  // Agenda desde el encabezado: lleva al resumen y enfoca el formulario
  $("#ctaAgenda")?.addEventListener("click", () => {
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
  estado = cargarEstado();
  sincronizarControles();
  pintarPlanes();
  renderTodo();
  ir(estado.paso, false);
}

