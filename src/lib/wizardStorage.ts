import type { AstroCookies } from 'astro';

export interface WizardData {
  company?: {
    employees: number;
    locations: string;
  };
  packageId?: string;
  biometric?: {
    bioRequired: boolean;
    bioCount?: number;
    bioType?: string;
  };
  currentStep?: number;
  completedSteps?: number[];
}

const COOKIE_NAME = 'wizard-data';
const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 60 * 60 * 24, // 24 horas
  httpOnly: false,
  secure: import.meta.env.PROD,
  sameSite: 'lax' as const,
};

export class WizardStorage {
  static get(cookies: AstroCookies): WizardData {
    try {
      const data = cookies.get(COOKIE_NAME)?.value;
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error parsing wizard data:', error);
      return {};
    }
  }

  static set(cookies: AstroCookies, data: WizardData): void {
    cookies.set(COOKIE_NAME, JSON.stringify(data), COOKIE_OPTIONS);
  }

  static update(cookies: AstroCookies, updates: Partial<WizardData>): WizardData {
    const current = this.get(cookies);
    const updated = { ...current, ...updates };
    this.set(cookies, updated);
    return updated;
  }

  static clear(cookies: AstroCookies): void {
    cookies.delete(COOKIE_NAME, { path: '/' });
  }

  static markStepComplete(cookies: AstroCookies, step: number): void {
    const data = this.get(cookies);
    const completedSteps = new Set(data.completedSteps || []);
    completedSteps.add(step);
    this.update(cookies, { 
      completedSteps: Array.from(completedSteps),
      currentStep: step + 1,
    });
  }

  static canAccessStep(cookies: AstroCookies, requestedStep: number): boolean {
    const data = this.get(cookies);
    const completedSteps = data.completedSteps || [];
    
    // Puede acceder al step 1 siempre
    if (requestedStep === 1) return true;
    
    // Puede acceder si completó el step anterior
    return completedSteps.includes(requestedStep - 1);
  }

  static isStepComplete(cookies: AstroCookies, step: number): boolean {
    const data = this.get(cookies);
    
    switch (step) {
      case 1:
        return !!(data.company?.employees && data.company?.locations);
      case 2:
        return !!data.packageId;
      case 3:
        return data.biometric?.bioRequired !== undefined;
      default:
        return false;
    }
  }

  static validateStep(cookies: AstroCookies, step: number): { isValid: boolean; errors: string[] } {
    const data = this.get(cookies);
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!data.company?.employees) {
          errors.push('El número de empleados es requerido');
        } else if (data.company.employees < 1) {
          errors.push('Debes indicar al menos 1 empleado');
        } else if (data.company.employees > 100) {
          errors.push('El máximo es 100 empleados');
        }
        
        if (!data.company?.locations) {
          errors.push('Debes seleccionar el número de sedes');
        }
        break;

      case 2:
        if (!data.packageId) {
          errors.push('Debes seleccionar un paquete');
        }
        break;

      case 3:
        if (data.biometric?.bioRequired === undefined) {
          errors.push('Indica si requieres biométricos');
        }
        if (data.biometric?.bioRequired && (!data.biometric.bioCount || data.biometric.bioCount < 1)) {
          errors.push('Indica el número de dispositivos biométricos');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
