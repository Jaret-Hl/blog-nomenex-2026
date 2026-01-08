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
