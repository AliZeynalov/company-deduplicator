import { normalizeCompanyName, calculateTokenOverlap } from '../utils/normalizer';
import { DEFAULT_CONFIG } from '../config';

describe('Normalizer', () => {
  const cfg = { ...DEFAULT_CONFIG };

  it('removes accents, suffixes and punctuation', () => {
    const raw = 'Ubisoft Montréal Studio!';
    const expected = 'ubisoft montreal';
    expect(normalizeCompanyName(raw, cfg)).toBe(expected);
  });

  it('token overlap detects reordered words', () => {
    const a = normalizeCompanyName('Montreal Ubisoft', cfg);
    const b = normalizeCompanyName('Ubisoft Montreal', cfg);
    expect(calculateTokenOverlap(a, b)).toBe(1);
  });
}); 