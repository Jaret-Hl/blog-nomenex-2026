import { getTodayInMexicoCity } from "./dateUtils";
import {
  generateTimeSlots,
  calculateEndTime,
  type AvailabilityResponse,
  type TimeSlot,
} from "./slotManager";
import { actions } from "astro:actions";
import { sanitizeInput } from "./sanitize";
import { ClientDataManager, type ClientData } from "@/lib/clientDataManager";

interface BookingState {
  selectedSlot: string | null;
  selectedDate: string | null;
  clientData: ClientData | null;
}

interface DOMElements {
  modal: HTMLElement | null;
  overlay: HTMLElement | null;
  closeBtn: HTMLElement | null;
  cancelBtn: HTMLElement | null;
  confirmBtn: HTMLButtonElement | null;
  dateInput: HTMLInputElement | null;
  slotsContainer: HTMLElement | null;
}

export class BookingModalManager {
  private state: BookingState;
  private elements: DOMElements;

  constructor() {
    this.state = {
      selectedSlot: null,
      selectedDate: null,
      clientData: null,
    };

    this.elements = {
      modal: document.getElementById("booking-modal"),
      overlay: document.getElementById("modal-overlay"),
      closeBtn: document.getElementById("close-modal"),
      cancelBtn: document.getElementById("cancel-booking"),
      confirmBtn: document.getElementById(
        "confirm-booking"
      ) as HTMLButtonElement,
      dateInput: document.getElementById("booking-date") as HTMLInputElement,
      slotsContainer: document.getElementById("slots-container"),
    };
  }

  public init(): void {
    this.setupDateInput();
    this.setupEventListeners();
    this.exposeGlobalMethods();
  }

  private setupDateInput(): void {
    if (this.elements.dateInput) {
      this.elements.dateInput.min = getTodayInMexicoCity();
    }
  }

  private setupEventListeners(): void {
    this.elements.closeBtn?.addEventListener("click", () => this.closeModal());
    this.elements.cancelBtn?.addEventListener("click", () => this.closeModal());
    this.elements.overlay?.addEventListener("click", () => this.closeModal());
    this.elements.dateInput?.addEventListener("change", (e) =>
      this.handleDateChange(e)
    );
    this.elements.confirmBtn?.addEventListener("click", () =>
      this.confirmBooking()
    );
  }

  private exposeGlobalMethods(): void {
    window.openBookingModal = (clientData?: ClientData) => {
      if (clientData) {
        const validated = ClientDataManager.validate(clientData);
        if (!validated.isValid) {
          alert(`Datos inválidos: ${validated.errors?.join(", ")}`);
          return;
        }
        this.state.clientData = validated;
      }
      this.openModal();
    };
  }

  private openModal(): void {
    this.elements.modal?.classList.remove("hidden");
  }

  private closeModal(): void {
    this.elements.modal?.classList.add("hidden");
    this.resetBookingState();
  }

  private resetBookingState(): void {
    this.state.selectedSlot = null;
    this.state.selectedDate = null;
    if (this.elements.confirmBtn) {
      this.elements.confirmBtn.disabled = true;
    }
  }

  private async handleDateChange(e: Event): Promise<void> {
    const date = (e.target as HTMLInputElement).value;
    this.state.selectedDate = date;
    this.state.selectedSlot = null;

    if (this.elements.confirmBtn) {
      this.elements.confirmBtn.disabled = true;
    }

    if (!this.elements.slotsContainer) return;

    this.showLoadingState();

    try {
      const scheduleItems = await this.fetchAvailability(date);
      const slots = generateTimeSlots(scheduleItems);
      this.renderSlots(slots);
    } catch (error) {
      this.showErrorState();
    }
  }

  private showLoadingState(): void {
    if (!this.elements.slotsContainer) return;

    this.elements.slotsContainer.innerHTML = `
      <div class="col-span-4 flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    `;
  }

  private showErrorState(): void {
    if (!this.elements.slotsContainer) return;

    this.elements.slotsContainer.innerHTML = `
      <p class="col-span-4 text-center text-red-500 py-8">
        ⚠️ Error al cargar horarios. Intenta nuevamente.
      </p>
    `;
  }

  private async fetchAvailability(date: string): Promise<any[]> {
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });

    const data: AvailabilityResponse = await res.json();
    return data.value?.[0]?.scheduleItems || [];
  }

  private renderSlots(slots: TimeSlot[]): void {
    if (!this.elements.slotsContainer) return;

    this.elements.slotsContainer.innerHTML = slots
      .map((slot) => this.createSlotHTML(slot))
      .join("");

    this.attachSlotListeners();
  }

  private createSlotHTML(slot: TimeSlot): string {
    const availableClasses =
      "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105";
    const unavailableClasses =
      "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed";

    return `
      <button
        class="slot-btn rounded-lg border-2 px-4 py-3 text-center font-medium transition-all ${
          slot.available ? availableClasses : unavailableClasses
        }"
        data-time="${slot.time}"
        ${slot.available ? "" : "disabled"}
      >
        ${slot.time}
      </button>
    `;
  }

  private attachSlotListeners(): void {
    document.querySelectorAll(".slot-btn:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () =>
        this.handleSlotSelection(btn as HTMLButtonElement)
      );
    });
  }

  private handleSlotSelection(btn: HTMLButtonElement): void {
    // Remove selection from all slots
    document.querySelectorAll(".slot-btn").forEach((b) => {
      b.classList.remove(
        "border-blue-600",
        "bg-blue-600",
        "text-white",
        "scale-105"
      );
      b.classList.add("border-gray-300", "dark:border-gray-600");
    });

    // Add selection to clicked slot
    btn.classList.remove("border-gray-300", "dark:border-gray-600");
    btn.classList.add(
      "border-blue-600",
      "bg-blue-600",
      "text-white",
      "scale-105"
    );

    this.state.selectedSlot = btn.getAttribute("data-time");

    if (this.elements.confirmBtn) {
      this.elements.confirmBtn.disabled = false;
    }
  }

  private async confirmBooking(): Promise<void> {
    if (
      !this.state.selectedDate ||
      !this.state.selectedSlot ||
      !this.state.clientData
    ) {
      alert("Por favor completa todos los datos requeridos");
      return;
    }
    if (!this.elements.confirmBtn) return;

    // Construir fechas ISO 8601 válidas
    const startISO = new Date(
      `${this.state.selectedDate}T${this.state.selectedSlot}:00`
    ).toISOString();
    const endISO = new Date(
      calculateEndTime(this.state.selectedDate, this.state.selectedSlot)
    ).toISOString();

    try {
      this.elements.confirmBtn.textContent = "Confirmando...";
      this.elements.confirmBtn.disabled = true;

      const result = await this.submitBooking(
        startISO,
        endISO,
        this.state.clientData
      );

      if (result.success) {
        alert(
          result.message ||
            "¡Sesión agendada exitosamente! Recibirás un correo de confirmación."
        );
        this.closeModal();
      } else {
        alert("Error al agendar. Intenta nuevamente.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error al agendar: ${errorMessage}`);
      console.error("Booking error:", error);
    } finally {
      this.elements.confirmBtn.textContent = "Confirmar reserva";
      this.elements.confirmBtn.disabled = !this.state.selectedSlot;
    }
  }

  private async submitBooking(
    start: string,
    end: string,
    clientData: ClientData
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const { data, error } = await actions.bookSession({
        start,
        end,
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientCompany: clientData.company,
        clientPhone: clientData.phone,
      });

      if (error) {
        console.error("Action error:", error);
        throw new Error(error.message || "Error en la validación de datos");
      }

      return {
        success: data?.success || false,
        message: data?.message,
      };
    } catch (error) {
      console.error("Submit booking error:", error);
      throw error;
    }
  }
}

// Type declaration for global window method
declare global {
  interface Window {
    openBookingModal: (clientData?: ClientData) => void;
  }
}
