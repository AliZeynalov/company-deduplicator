/**
 * Core types for the company deduplication system
 */

export interface DeduplicationConfig {
  // Layer thresholds
  highSimilarityThreshold: number;
  tokenMatchThreshold: number;
  partialMatchThreshold: number;
  
  // Normalization options
  removeSuffixes: boolean;
  handleAccents: boolean;
  removeNumbers: boolean;
  
  // Output control
  minConfidenceScore: number;
  maxResultsPerCompany: number;
}

export interface CompanyMatch {
  original: string;
  candidate: string;
  confidence: number;
  method: MatchMethod;
  normalizedOriginal: string;
  normalizedCandidate: string;
}

export interface DuplicateGroup {
  original: string;
  duplicates: CompanyMatch[];
  totalMatches: number;
}

export interface DeduplicationResult {
  totalCompanies: number;
  duplicateGroups: DuplicateGroup[];
  processingTimeMs: number;
  config: DeduplicationConfig;
}

export type MatchMethod = 
  | 'exact_after_normalization'
  | 'high_similarity'
  | 'token_match'
  | 'partial_match';

export type OutputFormat = 'json' | 'text' | 'csv';

export type ConfigPreset = 'conservative' | 'balanced' | 'aggressive';

export interface CliOptions {
  inputFile: string;
  outputFile?: string;
  preset?: ConfigPreset;
  minSimilarity?: number;
  minConfidence?: number;
  format?: OutputFormat;
  verbose?: boolean;
} 