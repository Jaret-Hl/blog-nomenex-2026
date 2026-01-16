import { sanitizeInput } from '@/utils/sanitize';

export interface ClientData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

export interface ValidatedClientData extends ClientData {
  isValid: boolean;
  errors?: string[];
}

export class ClientDataManager {
  /**
   * Valida y sanitiza los datos del cliente
   */
  static validate(data: Partial<ClientData>): ValidatedClientData {
    const errors: string[] = [];
    
    const name = sanitizeInput.name(data.name || '');
    const email = sanitizeInput.email(data.email || '');
    const company = data.company ? sanitizeInput.text(data.company) : undefined;
    const phone = data.phone ? sanitizeInput.text(data.phone) : undefined;

    if (!name) errors.push('Nombre inválido');
    if (!email) errors.push('Email inválido');

    return {
      name,
      email,
      company,
      phone,
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Obtiene datos del formulario del DOM
   */
  static fromForm(formId: string = 'contactForm'): ValidatedClientData {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) {
      return {
        name: '',
        email: '',
        isValid: false,
        errors: ['Formulario no encontrado'],
      };
    }

    const nameInput = document.getElementById('userName') as HTMLInputElement;
    const emailInput = document.getElementById('userEmail') as HTMLInputElement;
    const companyInput = document.getElementById('userCompany') as HTMLInputElement;
    const phoneInput = document.getElementById('userPhone') as HTMLInputElement;

    return this.validate({
      name: nameInput?.value || '',
      email: emailInput?.value || '',
      company: companyInput?.value || '',
      phone: phoneInput?.value || '',
    });
  }
}
