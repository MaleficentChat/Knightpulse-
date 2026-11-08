'use strict';

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.field = field || null;
  }
}

function requiredString(value, field, maxLength = 200) {
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`, field);
  }
  const normalized = value.trim();
  if (!normalized) throw new ValidationError(`${field} is required`, field);
  if (normalized.length > maxLength) {
    throw new ValidationError(`${field} is too long`, field);
  }
  return normalized;
}

function boundedInteger(value, field, min, max) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new ValidationError(`${field} must be an integer between ${min} and ${max}`, field);
  }
  return parsed;
}

module.exports = { ValidationError, requiredString, boundedInteger };
