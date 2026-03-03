/**
 * Validation and Sanitization Utilities
 * Provides input validation and sanitization functions for security
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validate email format (acepta cualquier TLD: .com, .co, .ce, .cl, .com.co, .org, etc.)
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const trimmed = email.trim();
  // Una @, al menos un punto en la parte dominio; TLD de 2+ caracteres (.co, .ce, .cl, .com, etc.)
  const emailRegex = /^[^\s@]+@[^\s@]+(\.[^\s@]+)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validate numeric input
 */
export function isValidNumber(value: any, min?: number, max?: number): boolean {
  const num = Number(value);
  if (isNaN(num)) {
    return false;
  }
  if (min !== undefined && num < min) {
    return false;
  }
  if (max !== undefined && num > max) {
    return false;
  }
  return true;
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
}

/**
 * Validate string length
 */
export function isValidLength(value: string, min?: number, max?: number): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const length = value.trim().length;
  if (min !== undefined && length < min) {
    return false;
  }
  if (max !== undefined && length > max) {
    return false;
  }
  return true;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key]) as any;
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) =>
        typeof item === 'string' ? sanitizeString(item) : typeof item === 'object' ? sanitizeObject(item) : item
      ) as any;
    }
  }
  return sanitized;
}

/**
 * Validate and sanitize form data
 */
export function validateAndSanitizeFormData<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, (value: any) => boolean | string>
): { isValid: boolean; errors: Record<string, string>; sanitized: T } {
  const errors: Record<string, string> = {};
  const sanitized = { ...data };

  for (const key in rules) {
    const rule = rules[key];
    const value = sanitized[key];
    const result = rule(value);

    if (result !== true) {
      errors[key] = typeof result === 'string' ? result : `Invalid value for ${key}`;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value) as any;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

