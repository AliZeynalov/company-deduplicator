/**
 * Configuration options for the deduplication process
 */
export interface DeduplicationConfig {
  // Layer-specific thresholds (0.0 to 1.0)
  exactMatchAfterNormalization: boolean;
  highSimilarityThreshold: number;
  tokenMatchThreshold: number;
  partialMatchThreshold: number;
  
  // Normalization settings
  removeSuffixes: boolean;
  handleAccents: boolean;
  removeNumbers: boolean;
  removeSpecialChars: boolean;
  
  // Output control
  minConfidenceScore: number;
  maxResultsPerCompany: number;
  
  // Performance settings
  enableParallelProcessing: boolean;
  batchSize: number;
}

/**
 * Predefined configuration presets
 */
export type ConfigPreset = 'conservative' | 'balanced' | 'aggressive';

/**
 * Represents a company match with confidence score
 */
export interface CompanyMatch {
  name: string;
  confidence: number;
  method: MatchMethod;
  originalIndex: number;
}

/**
 * Method used to find the match
 */
export type MatchMethod = 
  | 'exact_normalized'
  | 'high_similarity'
  | 'token_match'
  | 'partial_match';

/**
 * Group of duplicate companies
 */
export interface DuplicateGroup {
  original: string;
  originalIndex: number;
  duplicates: CompanyMatch[];
  averageConfidence: number;
}

/**
 * Result of the deduplication process
 */
export interface DeduplicationResult {
  totalCompanies: number;
  duplicateGroups: DuplicateGroup[];
  processingTimeMs: number;
  config: DeduplicationConfig;
  stats: ProcessingStats;
}

/**
 * Processing statistics
 */
export interface ProcessingStats {
  exactMatches: number;
  highSimilarityMatches: number;
  tokenMatches: number;
  partialMatches: number;
  totalMatches: number;
  averageConfidence: number;
}

/**
 * CLI options
 */
export interface CLIOptions {
  inputFile: string;
  outputFile?: string;
  preset?: ConfigPreset;
  format?: OutputFormat;
  interactive?: boolean;
  benchmark?: boolean;
  verbose?: boolean;
  
  // Custom thresholds
  minSimilarity?: number;
  minConfidence?: number;
  maxResults?: number;
}

/**
 * Output format options
 */
export type OutputFormat = 'json' | 'csv' | 'text';

/**
 * Normalized company data
 */
export interface NormalizedCompany {
  original: string;
  normalized: string;
  tokens: string[];
  originalIndex: number;
} 