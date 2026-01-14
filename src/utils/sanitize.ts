import DOMPurify from 'dompurify';
import validator from 'validator';

export const sanitizeInput = {
  // Sanitiza HTML para prevenir XSS
  html(dirty: string): string {
    return DOMPurify.sanitize(dirty, { 
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href']
    });
  },

  // Sanitiza texto plano
  text(input: string): string {
    return validator.escape(validator.trim(input));
  },

  // Sanitiza email
  email(email: string): string {
    return validator.normalizeEmail(email) || '';
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
  }
};
