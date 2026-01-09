export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertOptions {
  message: string;
  type: AlertType;
  duration?: number; // en milisegundos, 0 = no auto-cerrar
  dismissible?: boolean;
}

export class AlertManager {
  static show(elementId: string, options: AlertOptions): void {
    const alert = document.getElementById(elementId);
    const messageEl = document.getElementById(`${elementId}-message`);
    
    if (!alert || !messageEl) {
      console.warn(`Alert element with id "${elementId}" not found`);
      return;
    }

    // Actualizar mensaje
    messageEl.textContent = options.message;
    
    // Mostrar alerta
    alert.classList.remove('hidden');
    alert.classList.add('flex');
    
    // Scroll suave hacia la alerta
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-cerrar si se especifica duración
    if (options.duration && options.duration > 0) {
      setTimeout(() => {
        this.hide(elementId);
      }, options.duration);
    }
  }

  static hide(elementId: string): void {
    const alert = document.getElementById(elementId);
    if (alert) {
      alert.classList.add('hidden');
      alert.classList.remove('flex');
    }
  }

  static showSuccess(elementId: string, message: string, duration = 5000): void {
    this.show(elementId, { message, type: 'success', duration });
  }

  static showError(elementId: string, message: string, duration = 0): void {
    this.show(elementId, { message, type: 'error', duration });
  }

  static showWarning(elementId: string, message: string, duration = 5000): void {
    this.show(elementId, { message, type: 'warning', duration });
  }

  static showInfo(elementId: string, message: string, duration = 5000): void {
    this.show(elementId, { message, type: 'info', duration });
  }

  // Validación de campos de formulario
  static showFieldError(fieldId: string, message: string): void {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Agregar clase de error al campo
    field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
    field.classList.remove('border-gray-300');

    // Crear o actualizar mensaje de error
    let errorMsg = field.parentElement?.querySelector('.field-error-message');
    if (!errorMsg) {
      errorMsg = document.createElement('p');
      errorMsg.className = 'field-error-message text-red-600 text-xs mt-1';
      field.parentElement?.appendChild(errorMsg);
    }
    errorMsg.textContent = message;
  }

  static clearFieldError(fieldId: string): void {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Remover clases de error
    field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
    field.classList.add('border-gray-300');

    // Remover mensaje de error
    const errorMsg = field.parentElement?.querySelector('.field-error-message');
    errorMsg?.remove();
  }

  static clearAllFieldErrors(formId: string): void {
    const form = document.getElementById(formId);
    if (!form) return;

    // Limpiar todos los mensajes de error
    const errorMessages = form.querySelectorAll('.field-error-message');
    errorMessages.forEach(msg => msg.remove());

    // Limpiar clases de error
    const errorFields = form.querySelectorAll('.border-red-500');
    errorFields.forEach(field => {
      field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      field.classList.add('border-gray-300');
    });
  }
}
