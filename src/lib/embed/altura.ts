// Modo embebido (?embed=1): informa la altura del cotizador a la página que lo contiene (iframe).
export function reportarAltura(): void {
  if (new URLSearchParams(location.search).get("embed") !== "1" || window.parent === window) return;

  const enviar = () =>
    window.parent.postMessage({ tipo: "nomenex-altura", altura: document.documentElement.scrollHeight }, "*");

  new ResizeObserver(enviar).observe(document.body);
  window.addEventListener("load", enviar);
  enviar();
}
