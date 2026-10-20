import { identifierSchema, maskIdentifier, otpSchema, pinSchema } from '../schemas';

describe('identifierSchema', () => {
  it.each(['amina@staffsync.app', '+237 600 000 001', '237600000001', '600.000.001'])('accepts %s', (v) => {
    expect(identifierSchema.safeParse(v).success).toBe(true);
  });
  it.each(['', 'abc', 'a@b', '12345', '+237 6AB'])('rejects %s', (v) => {
    expect(identifierSchema.safeParse(v).success).toBe(false);
  });
});

describe('code schemas', () => {
  it('validates 6-digit OTP and 4-digit PIN', () => {
    expect(otpSchema.safeParse('123456').success).toBe(true);
    expect(otpSchema.safeParse('12345').success).toBe(false);
    expect(otpSchema.safeParse('12345a').success).toBe(false);
    expect(pinSchema.safeParse('1234').success).toBe(true);
    expect(pinSchema.safeParse('12345').success).toBe(false);
  });
});

describe('maskIdentifier', () => {
  it('hides most of the identifier', () => {
    expect(maskIdentifier('amina@staffsync.app')).toBe('a***@staffsync.app');
    expect(maskIdentifier('+237 600 000 001')).toBe('+237 ••• ••• 01');
  });
});
