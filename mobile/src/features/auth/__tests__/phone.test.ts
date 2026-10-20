import { formatAsYouType, listCountries, maskPhone, parseLocalPhone, placeholderFor } from '../phone';

describe('parseLocalPhone', () => {
  it('normalises to E.164 for each launch market', () => {
    expect(parseLocalPhone('07 12 34 56 78', 'CI')?.e164).toBe('+2250712345678');
    expect(parseLocalPhone('06 12 34 56 78', 'FR')).toEqual({ e164: '+33612345678', national: '612345678' });
  });
  it('drops the national trunk zero where the country uses one', () => {
    expect(parseLocalPhone('06 12 34 56 78', 'FR')?.national).toBe('612345678');
  });
  it('rejects numbers that are too short, malformed or invalid for the country', () => {
    expect(parseLocalPhone('12', 'CI')).toBeUndefined();
    expect(parseLocalPhone('07AB', 'CI')).toBeUndefined();
    expect(parseLocalPhone('0712345', 'FR')).toBeUndefined();
  });
});

describe('formatting', () => {
  it('groups digits while typing', () => {
    expect(formatAsYouType('0612345678', 'FR')).toBe('06 12 34 56 78');
  });
  it('provides a per-country example for the placeholder', () => {
    expect(placeholderFor('FR')).toMatch(/^0\d( \d\d){4}$/);
  });
  it('masks the middle of the number', () => {
    expect(maskPhone('+225', '0712345678')).toBe('+225 07 •• •• 78');
  });
});

describe('listCountries', () => {
  it('lists supported countries sorted with calling codes and flags', () => {
    const list = listCountries('en');
    expect(list.length).toBeGreaterThan(200);
    const ci = list.find((c) => c.code === 'CI');
    expect(ci?.dial).toBe('+225');
    expect(ci?.flag).toBe('🇨🇮');
  });
});
