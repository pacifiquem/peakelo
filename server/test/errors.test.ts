import { describe, expect, it } from 'vitest';
import { BadRequestError, isAppError, NotFoundError } from '../src/common/errors';

describe('AppError', () => {
  it('carries status and code', () => {
    const error = new NotFoundError('Player');
    expect(isAppError(error)).toBe(true);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Player not found');
  });

  it('accepts details on 400s', () => {
    const error = new BadRequestError('bad fen', { fen: 'invalid' });
    expect(error.details).toEqual({ fen: 'invalid' });
  });
});
