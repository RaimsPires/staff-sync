import { AppError } from '../../repositories/types';
import { ApiError, toAppError } from '../client';

describe('toAppError', () => {
  it('turns known API codes into domain errors, including UNSCHEDULED for proxy checks', () => {
    const e = toAppError(new ApiError(422, 'UNSCHEDULED', 'not scheduled'));
    expect(e).toBeInstanceOf(AppError);
    expect((e as AppError).code).toBe('UNSCHEDULED');
  });

  it('leaves unknown codes as API errors', () => {
    const e = new ApiError(500, 'BOOM', 'x');
    expect(toAppError(e)).toBe(e);
  });
});
