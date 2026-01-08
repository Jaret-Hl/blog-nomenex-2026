// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  wizardStep: defineAction({
    accept: 'form',
    input: z.object({
      step: z.coerce.number(),
      email: z.string().email().optional(),
      username: z.string().optional(),
    }),
    handler: async (input, { cookies }) => {
      const { step, ...data } = input;

      const previousData = JSON.parse(
        cookies.get('wizard-data')?.value ?? '{}'
      );

      cookies.set(
        'wizard-data',
        JSON.stringify({ ...previousData, ...data }),
        { path: '/' }
      );

      return { ok: true };
    },
  }),
};
