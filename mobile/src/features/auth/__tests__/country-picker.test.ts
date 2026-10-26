import { listCountries, norm, searchByName } from '../phone';

const all = listCountries('en');
const names = (q: string) => searchByName(all, norm(q)).map((c) => c.name);

describe('country search', () => {
  it('matches the country name only, not the calling code or the ISO code', () => {
    expect(names('cameroon')).toContain('Cameroon');
    expect(names('237')).toEqual([]); // Cameroon's calling code
    expect(names('cm')).not.toContain('Cameroon'); // its ISO code is not in the name
  });

  it('ignores accents and case', () => {
    expect(names("COTE D'IVOIRE").length + names('ivoire').length).toBeGreaterThan(0);
    expect(names('REUNION')).toEqual(names('réunion'));
  });

  it('lists names that start with the text before names that only contain it', () => {
    const got = names('guin');
    expect(got.length).toBeGreaterThan(2);
    expect(got[0].toLowerCase().startsWith('guin')).toBe(true);
    const firstContaining = got.findIndex((n) => !n.toLowerCase().startsWith('guin'));
    expect(got.slice(0, firstContaining < 0 ? got.length : firstContaining).every((n) => n.toLowerCase().startsWith('guin'))).toBe(true);
  });
});
