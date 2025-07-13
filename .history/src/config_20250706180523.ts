/**
 * Configuration system for company deduplication
 */

import { DeduplicationConfig, ConfigPreset } from './types';

/**
 * Preset configurations for different matching strategies
 */
export const CONFIG_PRESETS: Record<ConfigPreset, DeduplicationConfig> = {
  // Very strict - only high-confidence matches
  conservative: {
    highSimilarityThreshold: 0.92,
    tokenMatchThreshold: 0.88,
    partialMatchThreshold: 0.85,
    removeSuffixes: true,
    handleAccents: true,
    removeNumbers: false,
    minConfidenceScore: 0.85,
    maxResultsPerCompany: 5
  },
  
  // Balanced - good precision/recall trade-off
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
  
  // Aggressive - catch more potential duplicates
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

/**
 * Default configuration (same as balanced)
 */
export const DEFAULT_CONFIG: DeduplicationConfig = CONFIG_PRESETS.balanced;

/**
 * Creates a configuration from a preset
 */
export function createConfigFromPreset(preset: ConfigPreset): DeduplicationConfig {
  return { ...CONFIG_PRESETS[preset] };
}

/**
 * Creates a custom configuration with overrides
 */
export function createCustomConfig(
  basePreset: ConfigPreset = 'balanced',
  overrides: Partial<DeduplicationConfig> = {}
): DeduplicationConfig {
  const baseConfig = createConfigFromPreset(basePreset);
  return { ...baseConfig, ...overrides };
}

/**
 * Validates configuration values
 */
export function validateConfig(config: DeduplicationConfig): string[] {
  const errors: string[] = [];
  
  // Check thresholds are between 0 and 1
  if (config.highSimilarityThreshold < 0 || config.highSimilarityThreshold > 1) {
    errors.push('highSimilarityThreshold must be between 0 and 1');
  }
  
  if (config.tokenMatchThreshold < 0 || config.tokenMatchThreshold > 1) {
    errors.push('tokenMatchThreshold must be between 0 and 1');
  }
  
  if (config.partialMatchThreshold < 0 || config.partialMatchThreshold > 1) {
    errors.push('partialMatchThreshold must be between 0 and 1');
  }
  
  if (config.minConfidenceScore < 0 || config.minConfidenceScore > 1) {
    errors.push('minConfidenceScore must be between 0 and 1');
  }
  
  // Check maxResultsPerCompany is positive
  if (config.maxResultsPerCompany <= 0) {
    errors.push('maxResultsPerCompany must be greater than 0');
  }
  
  return errors;
}

/**
 * Gets configuration summary for display
 */
export function getConfigSummary(config: DeduplicationConfig): string {
  return `Configuration Summary:
  High Similarity Threshold: ${(config.highSimilarityThreshold * 100).toFixed(1)}%
  Token Match Threshold: ${(config.tokenMatchThreshold * 100).toFixed(1)}%
  Partial Match Threshold: ${(config.partialMatchThreshold * 100).toFixed(1)}%
  Minimum Confidence Score: ${(config.minConfidenceScore * 100).toFixed(1)}%
  Max Results Per Company: ${config.maxResultsPerCompany}
  Remove Suffixes: ${config.removeSuffixes ? 'Yes' : 'No'}
  Handle Accents: ${config.handleAccents ? 'Yes' : 'No'}
  Remove Numbers: ${config.removeNumbers ? 'Yes' : 'No'}`;
} 