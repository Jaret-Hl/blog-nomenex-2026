import type { WizardData, StepData } from '../types/wizard';

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export function getWizardData(): WizardData {
  try {
    const cookieValue = getCookie('wizard-data');
    if (!cookieValue) {
      console.warn('Cookie "wizard-data" no encontrada');
      return {};
    }
    const decodedValue = decodeURIComponent(cookieValue);
    return JSON.parse(decodedValue) as WizardData;
  } catch (error) {
    console.error('Error al parsear wizard-data:', error);
    return {};
  }
}

export function organizeDataBySteps(wizardData: WizardData): StepData {
  return {
    step1: {
      employees: wizardData.company?.employees || null,
      locations: wizardData.company?.locations || null,
    },
    step2: {
      packageId: wizardData.packageId || null,
    },
    step3: {
      bioRequired: wizardData.biometric?.bioRequired ?? null,
      bioCount: wizardData.biometric?.bioCount || null,
      bioType: wizardData.biometric?.bioType || null,
    },
  };
}

export function getBiometricTypeName(bioType: string | null | undefined): string {
  if (!bioType) return 'No especificado';
  const types: Record<string, string> = {
    'basic': 'Biométrico básico',
    'advanced': 'Biométrico avanzado',
    'terminal': 'Terminal con pantalla',
  };
  return types[bioType] || bioType;
}
