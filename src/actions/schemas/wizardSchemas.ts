import { z } from 'astro:schema';

export const WizardStepSchema = z.object({
  step: z.coerce.number().int().min(1).max(4),

  // STEP 1
  employees: z.coerce.number().min(1, 'Mínimo 1 empleado').max(100, 'Máximo 100 empleados').optional(),
  locations: z.string().min(1, 'Selecciona el número de sedes').optional(),

  // STEP 2
  packageId: z.string().min(1, 'Selecciona un paquete').optional(),

  // STEP 3
  bioRequired: z.string()
    .nullable()
    .optional()
    .transform(val => val === 'true'),
  bioCount: z.coerce.number().min(0, 'El número debe ser positivo').optional().nullable(),
  bioType: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  switch (data.step) {
    case 1:
      if (!data.employees) {
        ctx.addIssue({
          path: ['employees'],
          message: 'El número de empleados es requerido',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!data.locations) {
        ctx.addIssue({
          path: ['locations'],
          message: 'Debes seleccionar el número de sedes',
          code: z.ZodIssueCode.custom,
        });
      }
      break;

    case 2:
      if (!data.packageId) {
        ctx.addIssue({
          path: ['packageId'],
          message: 'Debes seleccionar un paquete',
          code: z.ZodIssueCode.custom,
        });
      }
      break;

    case 3:
      // Solo validar bioRequired en el step 3
      if (data.bioRequired === undefined || data.bioRequired === null) {
        ctx.addIssue({
          path: ['bioRequired'],
          message: 'Indica si requieres biométricos',
          code: z.ZodIssueCode.custom,
        });
      }
      if (data.bioRequired === true && (!data.bioCount || data.bioCount < 1)) {
        ctx.addIssue({
          path: ['bioCount'],
          message: 'Indica el número de dispositivos biométricos',
          code: z.ZodIssueCode.custom,
        });
      }
      break;
  }
});
