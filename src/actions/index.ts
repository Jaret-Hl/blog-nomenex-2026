// src/actions/index.ts
import { defineAction, ActionError } from "astro:actions";
import { WizardStepSchema } from "./schemas/wizardSchemas";
import { WizardStorage, type WizardData } from "../lib/wizardStorage";
import { calculateQuote } from "@/lib/pricing/calculateQuote";
import type { WizardState } from "@/lib/pricing/types";
import { bookSession } from './bookSession.server';

// Función para transformar WizardData a WizardState
function transformToWizardState(data: WizardData): WizardState | null {
  // Validar que tenemos todos los datos necesarios
  if (!data.company?.employees || !data.company?.locations) {
    return null;
  }
  if (!data.packageId) {
    return null;
  }
  if (data.biometric?.bioRequired === undefined) {
    return null;
  }

  return {
    step1: {
      employees: data.company.employees,
      locations: data.company.locations,
    },
    step2: {
      packageId: data.packageId,
    },
    step3: {
      bioRequired: data.biometric.bioRequired,
      bioCount: data.biometric.bioCount || 0,
      bioType: (data.biometric.bioType as "basic" | "advanced" | "terminal") || "basic",
    },
  };
}

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
      
      // Calcular cotización si tenemos todos los datos
      const wizardState = transformToWizardState(updatedData);
      if (wizardState) {
        const quote = calculateQuote(wizardState);
        console.log("Cotización calculada:", quote);
      } else {
        console.log("Datos incompletos para calcular cotización");
      }

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

  bookSession,
};