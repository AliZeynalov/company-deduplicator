import { findAllMatches } from '../utils/matcher';
import { CONFIG_PRESETS, DEFAULT_CONFIG } from '../config';

describe('findAllMatches', () => {
  const config = { ...DEFAULT_CONFIG };
  const agressivePreset = { ...DEFAULT_CONFIG, ...CONFIG_PRESETS.aggressive };

  it('detects exact match after normalisation (accent + suffix)', () => {
    const original = 'Ubisoft Montreal';
    const candidates = ['Ubisoft Montréal Studio', 'Ubisot Montral Studio' /** typo */ ];
    const matches = findAllMatches(original, candidates, config);
    expect(matches).toHaveLength(2);
    expect(matches[0].method).toBe('exact_after_normalization');
    expect(matches[1].method).toBe('high_similarity');
    expect(matches[0].confidence).toEqual(1);
    expect(matches[1].confidence).toBeGreaterThanOrEqual(config.highSimilarityThreshold);

  });

  it('detects high similarity (typo)', () => {
    const original = 'Bolt Technology';
    const candidates = ['Bolt Technlgy' /** typo */ ];
    const matches = findAllMatches(original, candidates, config);
    expect(matches[0].method).toBe('high_similarity');
    expect(matches[0].confidence).toBeGreaterThanOrEqual(config.highSimilarityThreshold);
  });

  it('detects token overlap (word order)', () => {
    const original = 'Ubisoft Montreal';
    const candidates = ['Montreal Ubisoft'];
    const matches = findAllMatches(original, candidates, config);
    expect(matches[0].method).toBe('token_match');
  });

  it('detects partial substring match when runs aggressive preset', () => {
    const original = 'Santa Monica Studio';
    const candidates = ['Sony Santa Monica']; // longer candidate contains shorter substring
    const matches = findAllMatches(original, candidates, agressivePreset);
    expect(matches).toHaveLength(1);
    expect(matches[0].method).toBe('partial_match');
    expect(matches[0].confidence).toBeGreaterThanOrEqual(agressivePreset.partialMatchThreshold);
  });

  it('filters out borderline matches with conservative preset', () => {
    const conservative = { ...CONFIG_PRESETS.conservative };
    const original = 'Getir';
    const candidates = ['Getir Brand']; // only token overlap 0.5, partial 0.5
    const matches = findAllMatches(original, candidates, conservative);
    // Should be filtered because 0.5 < conservative thresholds (0.88 / 0.85 / 0.85)
    expect(matches).toHaveLength(0);
  });
}); 