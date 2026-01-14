// Este archivo solo es necesario si tienes un backend con Express
// Si solo trabajas en frontend, puedes eliminar este archivo

// O si planeas usarlo después, descomenta cuando instales express:
/*
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validatePost = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres')
    .escape(),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('El contenido debe tener al menos 10 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
*/
