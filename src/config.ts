/**
 * Configuration presets and helpers
 */

import { DeduplicationConfig, ConfigPreset } from './types';

export const CONFIG_PRESETS: Record<ConfigPreset, DeduplicationConfig> = {
  conservative: {
    highSimilarityThreshold: 0.92,
    tokenMatchThreshold: 0.88,
    partialMatchThreshold: 0.85,
    removeSuffixes: true,
    handleAccents: true,
    removeNumbers: false,
    minConfidenceScore: 0.85,
    maxResultsPerCompany: 10
  },
  balanced: {
    highSimilarityThreshold: 0.85,
    tokenMatchThreshold: 0.80,
    partialMatchThreshold: 0.70,
    removeSuffixes: true,
    handleAccents: true,
    removeNumbers: false,
    minConfidenceScore: 0.75,
    maxResultsPerCompany: 10
  },
  aggressive: {
    highSimilarityThreshold: 0.78,
    tokenMatchThreshold: 0.70,
    partialMatchThreshold: 0.60,
    removeSuffixes: true,
    handleAccents: true,
    removeNumbers: false,
    minConfidenceScore: 0.60,
    maxResultsPerCompany: 15
  }
};

/** Default config = balanced approach */
export const DEFAULT_CONFIG: DeduplicationConfig = { ...CONFIG_PRESETS.balanced };

/**
 * Build a config from a preset with optional overrides
 */
export function createConfig(preset: ConfigPreset = 'balanced', overrides: Partial<DeduplicationConfig> = {}): DeduplicationConfig {
  return { ...CONFIG_PRESETS[preset], ...overrides };
}

/**
 * Validates config. Returns array of error messages (empty if valid)
 */
export function validateConfig(cfg: DeduplicationConfig): string[] {
  const errs: string[] = [];
  const between0and1 = (v: number, field: string) => {
    if (v < 0 || v > 1) errs.push(`${field} must be between 0 and 1`);
  };
  between0and1(cfg.highSimilarityThreshold, 'highSimilarityThreshold');
  between0and1(cfg.tokenMatchThreshold, 'tokenMatchThreshold');
  between0and1(cfg.partialMatchThreshold, 'partialMatchThreshold');
  between0and1(cfg.minConfidenceScore, 'minConfidenceScore');

  if (cfg.maxResultsPerCompany <= 0) {
    errs.push('maxResultsPerCompany must be > 0');
  }
  return errs;
}

/**
 * Prettify the print - communicate the config to the user better
 */
export function describeConfig(config: DeduplicationConfig): string {
  return `Configuration:\n  Preset thresholds: \n    • High similarity ≥ ${(config.highSimilarityThreshold*100).toFixed(0)}%\n    • Token match   ≥ ${(config.tokenMatchThreshold*100).toFixed(0)}%\n    • Partial match ≥ ${(config.partialMatchThreshold*100).toFixed(0)}%\n  Normalization: removeSuffixes=${config.removeSuffixes}, handleAccents=${config.handleAccents}, removeNumbers=${config.removeNumbers}\n  Output: minConfidence ≥ ${(config.minConfidenceScore*100).toFixed(0)}%, maxResultsPerCompany=${config.maxResultsPerCompany}`;
} 