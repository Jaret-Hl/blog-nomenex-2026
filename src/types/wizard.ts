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

export interface ContactData {
  userName: string;
  userCompany: string;
  userEmail: string;
  userPhone: string;
}

export interface QuoteData extends WizardData {
  contact?: ContactData;
  timestamp?: string;
  quote?: {
    package?: string;
    employees?: number;
    breakdown?: {
      packageCost: number;
      biometricsCost: number;
    };
    total: number;
  };
}

export interface StepData {
  step1: {
    employees: number | null;
    locations: string | null;
  };
  step2: {
    packageId: string | null;
  };
  step3: {
    bioRequired: boolean | null;
    bioCount: number | null;
    bioType: string | null;
  };
}
