/**
 * Company name normalization utilities
 */

import { DeduplicationConfig } from '../types';

// well-known business suffixes to be removed
const BUSINESS_SUFFIXES = [
  'ltd', 'limited', 'inc', 'incorporated', 'corp', 'corporation', 'co', 'company',
  'llc', 'limited liability company', 'plc', 'public limited company',
  'studio', 'studios', 'games', 'entertainment', 'interactive', 'digital',
  'software', 'technologies', 'tech', 'systems', 'solutions', 'services',
  'group', 'holdings', 'ventures', 'partners', 'associates', 'enterprises'
];

// well-known geographic terms that might represent different offices
const GEOGRAPHIC_TERMS = [
  'usa', 'us', 'america', 'american', 'canada', 'canadian', 'uk', 'britain', 'british',
  'europe', 'european', 'asia', 'asian', 'japan', 'japanese', 'china', 'chinese',
  'france', 'french', 'germany', 'german', 'italy', 'italian', 'spain', 'spanish',
  'montreal', 'toronto', 'vancouver', 'london', 'paris', 'berlin', 'tokyo', 'shanghai',
  'emea', 'benelux', 'oecd'
];

/**
 * Normalize a company name for comparison
 */
export function normalizeCompanyName(name: string, config: DeduplicationConfig): string {
  let normalized = name.toLowerCase().trim();
  
  if (config.handleAccents) {
    normalized = removeAccents(normalized);
  }
  
  // Remove numbers if configured
  if (config.removeNumbers) {
    normalized = normalized.replace(/\d+/g, '');
  }
  
  // Remove special characters and extra whitespace
  normalized = normalized
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ') 
    .trim();
  
  // Remove common suffixes
  if (config.removeSuffixes) {
    normalized = removeSuffixes(normalized);
  }
  
  return normalized;
}

/**
 * Removes accents from characters (é -> e, ñ -> n, etc.)
 */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Removes common business suffixes
 */
export function removeSuffixes(text: string): string {
  const words = text.split(' ');
  const filtered = words.filter(word => {
    return !BUSINESS_SUFFIXES.includes(word.toLowerCase());
  });
  
  return filtered.join(' ').trim();
}

/**
 * Extracts tokens (words) from a normalized company name
 */
export function extractTokens(normalizedName: string): string[] {
  return normalizedName
    .split(' ')
    .filter(token => token.length > 0)
    .sort(); // Sort for consistent comparison
}

/**
 * Checks if two company names are likely the same company but different offices
 */
export function isLikelyGeographicVariant(name1: string, name2: string): boolean {
  const tokens1 = new Set(name1.toLowerCase().split(' '));
  const tokens2 = new Set(name2.toLowerCase().split(' '));
  
  // Find tokens that are only in one name
  const diff1 = Array.from(tokens1).filter(token => !tokens2.has(token));
  const diff2 = Array.from(tokens2).filter(token => !tokens1.has(token));
  
  // If the only differences are geographic terms, likely same company
  const isOnlyGeographic = (diffs: string[]) => {
    return diffs.length > 0 && diffs.every(diff => 
      GEOGRAPHIC_TERMS.includes(diff.toLowerCase())
    );
  };
  
  return isOnlyGeographic(diff1) || isOnlyGeographic(diff2);
}

/**
 * Creates a simplified version of the company name for fuzzy matching
 */
export function createFuzzySignature(normalizedName: string): string {
  const tokens = extractTokens(normalizedName);
  
  // Remove very short tokens
  const significantTokens = tokens.filter(token => token.length >= 2);
  
  // Take first 3 characters of each significant token
  const signature = significantTokens
    .map(token => token.substring(0, 3))
    .join('');
  
  return signature;
}

/**
 * Calculates token overlap between two company names
 */
export function calculateTokenOverlap(name1: string, name2: string): number {
  const tokens1 = new Set(extractTokens(name1));
  const tokens2 = new Set(extractTokens(name2));
  
  const intersection = new Set([...tokens1].filter(token => tokens2.has(token)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
} 