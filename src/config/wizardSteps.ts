export interface WizardStep {
  id: number;
  key: 'company' | 'package' | 'biometrics' | 'summary';
  label: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 1, key: 'company', label: 'Empresa' },
  { id: 2, key: 'package', label: 'Paquetes' },
  { id: 3, key: 'biometrics', label: 'Biométricos' },
  { id: 4, key: 'summary', label: 'Resumen' },
];

export function getNextStep(currentStep: number): number | null {
  const currentIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
  return currentIndex < WIZARD_STEPS.length - 1 
    ? WIZARD_STEPS[currentIndex + 1].id 
    : null;
}

export function getPreviousStep(currentStep: number): number | null {
  const currentIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
  return currentIndex > 0 
    ? WIZARD_STEPS[currentIndex - 1].id 
    : null;
}

export function isLastStep(step: number): boolean {
  return step === WIZARD_STEPS[WIZARD_STEPS.length - 1].id;
}
