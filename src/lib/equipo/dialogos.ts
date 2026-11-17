// Abre y cierra las tarjetas digitales (elemento <dialog> nativo) y copia datos al portapapeles.
export function initTarjetas(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-abrir]").forEach((boton) =>
    boton.addEventListener("click", () => {
      const dialogo = document.getElementById(`tarjeta-${boton.dataset.abrir}`) as HTMLDialogElement | null;
      dialogo?.showModal();
    })
  );

  document.querySelectorAll<HTMLDialogElement>("dialog.tarjeta").forEach((dialogo) => {
    dialogo.querySelector("[data-cerrar]")?.addEventListener("click", () => dialogo.close());
    dialogo.addEventListener("click", (e) => {
      if (e.target === dialogo) dialogo.close();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-copiar]").forEach((boton) =>
    boton.addEventListener("click", async () => {
      const original = boton.textContent;
      try {
        await navigator.clipboard.writeText(boton.dataset.copiar ?? "");
        boton.textContent = "Copiado";
      } catch {
        boton.textContent = "No disponible";
      }
      setTimeout(() => (boton.textContent = original), 1600);
    })
  );
}
