// src/actions/index.ts
import { defineAction, ActionError } from "astro:actions";
import { WizardStepSchema } from "./schemas/wizardSchemas";
import { WizardStorage } from "../lib/wizardStorage";

export const server = {
  wizardStep: defineAction({
    accept: "form",
    input: WizardStepSchema, // se importa el esquema del wizard
    handler: async (input, { cookies }) => {
      const { step, ...payload } = input;

      // Validar que puede acceder a este step
      if (!WizardStorage.canAccessStep(cookies, step) && step > 1) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Debes completar los pasos anteriores primero",
        });
      }

      const currentData = WizardStorage.get(cookies);

      switch (step) {
        case 1:
          if ('employees' in payload && 'locations' in payload) {
            WizardStorage.update(cookies, {
              company: {
                employees: payload.employees!,
                locations: payload.locations!,
              },
            });
            WizardStorage.markStepComplete(cookies, 1);
          }
          break;

        case 2:
          if ('packageId' in payload) {
            WizardStorage.update(cookies, {
              packageId: payload.packageId,
            });
            WizardStorage.markStepComplete(cookies, 2);
          }
          break;

        case 3:
          if ('bioRequired' in payload) {
            WizardStorage.update(cookies, {
              biometric: {
                bioRequired: payload.bioRequired!,
                bioCount: payload.bioCount,
              },
            });
            WizardStorage.markStepComplete(cookies, 3);
          }
          break;
      }

      return { 
        success: true,
        nextStep: step + 1,
        data: WizardStorage.get(cookies),
      };
    },
  }),

  clearWizard: defineAction({
    accept: "json",
    handler: async (_, { cookies }) => {
      WizardStorage.clear(cookies);
      return { success: true };
    },
  }),
};
