/**
 * Main entry point for the company deduplication system
 */

// Export main classes and types for library usage
export { CompanyDeduplicator } from './deduplicator';
export { 
  DeduplicationConfig, 
  DeduplicationResult, 
  DuplicateGroup, 
  CompanyMatch, 
  MatchMethod, 
  OutputFormat, 
  ConfigPreset, 
  CliOptions 
} from './types';
export { 
  CONFIG_PRESETS, 
  DEFAULT_CONFIG, 
  createConfigFromPreset, 
  createCustomConfig, 
  validateConfig, 
  getConfigSummary 
} from './config';
export { 
  normalizeCompanyName, 
  removeAccents, 
  removeSuffixes, 
  extractTokens, 
  calculateTokenOverlap, 
  isLikelyGeographicVariant, 
  createFuzzySignature 
} from './utils/normalizer';
export { 
  calculateLevenshteinDistance, 
  calculateSimilarity, 
  findAllMatches 
} from './utils/matcher';
export { 
  readCompanyNamesFromFile, 
  writeResultsToFile, 
  validateAndNormalizePath, 
  getFileStats 
} from './utils/fileReader';

// Run CLI if called directly
if (require.main === module) {
  import('./cli').then(({ main }) => {
    main();
  });
} 