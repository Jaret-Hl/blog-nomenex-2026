import DOMPurify from 'dompurify';
import validator from 'validator';

export const sanitizeInput = {
  // Sanitiza HTML para prevenir XSS
 /*  html(dirty: string): string {
    return DOMPurify.sanitize(dirty, { 
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href']
    });
  }, */

  // Sanitiza texto plano
  text(input: string): string {
    return validator.escape(validator.trim(input));
  },

  // Sanitiza email
  email(email: string): string {
    return validator.normalizeEmail(email) || '';
  },

  company(input: string): string {
    const trimmed = validator.trim(input);
    return validator.escape(trimmed.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s&.,-]/g, ''));
  },

  // Sanitiza URL
  url(url: string): string {
    const trimmed = validator.trim(url);
    return validator.isURL(trimmed) ? trimmed : '';
  },

  // Sanitiza números
  number(input: string | number): number {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    return isNaN(num) ? 0 : num;
  },

  // Previene SQL injection removiendo caracteres peligrosos
  sqlSafe(input: string): string {
    // Remover caracteres especiales de SQL
    return input.replace(/['";\\]/g, '');
  },

  // Sanitiza nombres (solo letras, espacios y guiones)
  name(input: string): string {
    const trimmed = validator.trim(input);
    return validator.escape(trimmed.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]/g, ''));
  },

  // Sanitiza teléfonos (solo números, +, -, (, ))
  phone(input: string): string {
    return validator.trim(input).replace(/[^0-9+\-() ]/g, '');
  }
};
