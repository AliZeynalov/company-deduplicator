
/**
 * Configuration for the deduplication process
 */
export interface DeduplicationConfig {
  // Layer thresholds (0-1, where 1 is exact match)
  highSimilarityThreshold: number;  // For Levenshtein-based matching
  tokenMatchThreshold: number;      // For word-level matching
  partialMatchThreshold: number;    // For substring matching
  
  // Normalization options
  removeSuffixes: boolean;          // Remove "Ltd", "Inc", "Studio", etc.
  handleAccents: boolean;           // Convert é -> e, ñ -> n, etc.
  removeNumbers: boolean;           // Remove numeric characters
  
  // Output control
  minConfidenceScore: number;       // Minimum confidence to include in results
  maxResultsPerCompany: number;     // Max duplicates to return per company
}

/**
 * A single match between two companies
 */
export interface CompanyMatch {
  original: string;                 // The original company name
  candidate: string;                // The potential duplicate
  confidence: number;               // Match confidence (0-1)
  method: MatchMethod;              // How this match was found
  normalizedOriginal: string;       // Normalized version of original
  normalizedCandidate: string;      // Normalized version of candidate
}

/**
 * Methods used to find matches
 */
export type MatchMethod = 
  | 'exact_after_normalization'     // Perfect match after cleaning
  | 'high_similarity'               // High string similarity
  | 'token_match'                   // Word-level matching
  | 'partial_match';                // Substring matching

/**
 * A group of duplicates for one company
 */
export interface DuplicateGroup {
  original: string;                 // The main company name
  duplicates: CompanyMatch[];       // All found duplicates
  totalMatches: number;             // Count of duplicates
}

/**
 * Complete results from deduplication process
 */
export interface DeduplicationResult {
  totalCompanies: number;           // Total companies processed
  duplicateGroups: DuplicateGroup[]; // All duplicate groups found
  processingTimeMs: number;         // Time taken in milliseconds
  config: DeduplicationConfig;      // Configuration used
}

/**
 * Predefined configuration presets
 */
export type ConfigPreset = 'conservative' | 'balanced' | 'aggressive';

/**
 * Output format options
 */
export type OutputFormat = 'json' | 'text' | 'csv';

/**
 * Command-line interface options
 */
export interface CliOptions {
  inputFile: string;                // Path to input file
  outputFile?: string;              // Optional output file
  preset?: ConfigPreset;            // Configuration preset
  minSimilarity?: number;           // Override similarity threshold
  minConfidence?: number;           // Override confidence threshold
  format?: OutputFormat;            // Output format
  verbose?: boolean;                // Show detailed output
} 