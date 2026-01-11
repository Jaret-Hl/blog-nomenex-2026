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
          if ("employees" in payload && "locations" in payload) {
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
          if ("packageId" in payload) {
            WizardStorage.update(cookies, {
              packageId: payload.packageId,
            });
            WizardStorage.markStepComplete(cookies, 2);
          }
          break;

        case 3:
          if ("bioRequired" in payload) {
            const bioRequired = payload.bioRequired as boolean;

            console.log("Step 3 - Datos recibidos:", {
              bioRequired: payload.bioRequired,
              bioCount: payload.bioCount,
              bioType: payload.bioType,
            });

            WizardStorage.update(cookies, {
              biometric: {
                bioRequired: bioRequired,
                bioCount: bioRequired ? payload.bioCount || 0 : 0,
                bioType: bioRequired ? payload.bioType || "" : "",
              },
            });
            WizardStorage.markStepComplete(cookies, 3);
          }
          break;
      }

      const updatedData = WizardStorage.get(cookies);
      console.log("Datos guardados en cookie:", updatedData);

      return {
        success: true,
        nextStep: step + 1,
        data: updatedData,
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
