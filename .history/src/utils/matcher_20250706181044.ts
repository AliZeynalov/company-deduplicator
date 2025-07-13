/**
 * Fuzzy matching algorithms for company name comparison
 */

import { CompanyMatch, MatchMethod, DeduplicationConfig } from '../types';
import { 
  normalizeCompanyName, 
  extractTokens, 
  calculateTokenOverlap,
  isLikelyGeographicVariant 
} from './normalizer';

/**
 * Calculates Levenshtein distance between two strings
 */
export function calculateLevenshteinDistance(str1: string, str2: string): number {
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;
  
  const matrix: number[][] = [];
  
  // Initialize first row and column
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculates similarity percentage based on Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  
  const distance = calculateLevenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
}

/**
 * Checks for exact match after normalization
 */
export function findExactMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const normalizedOriginal = normalizeCompanyName(original, config);
  const matches: CompanyMatch[] = [];
  
  for (const candidate of candidates) {
    if (candidate === original) continue;
    
    const normalizedCandidate = normalizeCompanyName(candidate, config);
    
    if (normalizedOriginal === normalizedCandidate) {
      matches.push({
        original,
        candidate,
        confidence: 1.0,
        method: 'exact_after_normalization',
        normalizedOriginal,
        normalizedCandidate
      });
    }
  }
  
  return matches;
}

/**
 * Finds matches with high string similarity (Levenshtein-based)
 */
export function findHighSimilarityMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const normalizedOriginal = normalizeCompanyName(original, config);
  const matches: CompanyMatch[] = [];
  
  for (const candidate of candidates) {
    if (candidate === original) continue;
    
    const normalizedCandidate = normalizeCompanyName(candidate, config);
    const similarity = calculateSimilarity(normalizedOriginal, normalizedCandidate);
    
    if (similarity >= config.highSimilarityThreshold) {
      matches.push({
        original,
        candidate,
        confidence: similarity,
        method: 'high_similarity',
        normalizedOriginal,
        normalizedCandidate
      });
    }
  }
  
  return matches;
}

/**
 * Finds matches based on token overlap (word-level similarity)
 */
export function findTokenMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const normalizedOriginal = normalizeCompanyName(original, config);
  const matches: CompanyMatch[] = [];
  
  for (const candidate of candidates) {
    if (candidate === original) continue;
    
    const normalizedCandidate = normalizeCompanyName(candidate, config);
    const tokenOverlap = calculateTokenOverlap(normalizedOriginal, normalizedCandidate);
    
    if (tokenOverlap >= config.tokenMatchThreshold) {
      // Boost confidence for geographic variants
      let confidence = tokenOverlap;
      if (isLikelyGeographicVariant(normalizedOriginal, normalizedCandidate)) {
        confidence = Math.min(confidence + 0.1, 1.0); // Boost by 10%
      }
      
      matches.push({
        original,
        candidate,
        confidence,
        method: 'token_match',
        normalizedOriginal,
        normalizedCandidate
      });
    }
  }
  
  return matches;
}

/**
 * Finds matches based on partial substring matching
 */
export function findPartialMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const normalizedOriginal = normalizeCompanyName(original, config);
  const matches: CompanyMatch[] = [];
  
  for (const candidate of candidates) {
    if (candidate === original) continue;
    
    const normalizedCandidate = normalizeCompanyName(candidate, config);
    
    // Check if one is a substring of the other
    const isSubstring = normalizedOriginal.includes(normalizedCandidate) || 
                       normalizedCandidate.includes(normalizedOriginal);
    
    if (isSubstring) {
      const shorter = normalizedOriginal.length < normalizedCandidate.length ? 
                     normalizedOriginal : normalizedCandidate;
      const longer = normalizedOriginal.length >= normalizedCandidate.length ? 
                    normalizedOriginal : normalizedCandidate;
      
      // Confidence based on how much of the longer string is covered
      const confidence = shorter.length / longer.length;
      
      if (confidence >= config.partialMatchThreshold) {
        matches.push({
          original,
          candidate,
          confidence,
          method: 'partial_match',
          normalizedOriginal,
          normalizedCandidate
        });
      }
    }
  }
  
  return matches;
}

/**
 * Finds all potential matches for a company using multi-layer approach
 */
export function findAllMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const allMatches: CompanyMatch[] = [];
  
  // Layer 1: Exact matches after normalization
  const exactMatches = findExactMatches(original, candidates, config);
  allMatches.push(...exactMatches);
  
  // Layer 2: High similarity matches
  const highSimilarityMatches = findHighSimilarityMatches(original, candidates, config);
  allMatches.push(...highSimilarityMatches);
  
  // Layer 3: Token-based matches
  const tokenMatches = findTokenMatches(original, candidates, config);
  allMatches.push(...tokenMatches);
  
  // Layer 4: Partial matches
  const partialMatches = findPartialMatches(original, candidates, config);
  allMatches.push(...partialMatches);
  
  // Remove duplicates (same candidate found by multiple methods)
  const uniqueMatches = removeDuplicateMatches(allMatches);
  
  // Filter by minimum confidence score
  const filteredMatches = uniqueMatches.filter(
    match => match.confidence >= config.minConfidenceScore
  );
  
  // Sort by confidence (highest first) and limit results
  const sortedMatches = filteredMatches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, config.maxResultsPerCompany);
  
  return sortedMatches;
}

/**
 * Removes duplicate matches (same candidate found by multiple methods)
 * Keeps the match with highest confidence
 */
function removeDuplicateMatches(matches: CompanyMatch[]): CompanyMatch[] {
  const candidateMap = new Map<string, CompanyMatch>();
  
  for (const match of matches) {
    const existing = candidateMap.get(match.candidate);
    if (!existing || match.confidence > existing.confidence) {
      candidateMap.set(match.candidate, match);
    }
  }
  
  return Array.from(candidateMap.values());
} 