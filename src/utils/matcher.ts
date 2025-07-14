/**
 *  matching utilities for company deduplication
 */

import {
  DeduplicationConfig,
  CompanyMatch,
  MatchMethod
} from '../types';

import {
  normalizeCompanyName,
  calculateTokenOverlap,
  extractTokens
} from './normalizer';

/**********************
 * Helper algorithms  *
 **********************/

/**
 * Levenshtein distance (classical dynamic-programming implementation)
 * Returns the minimum number of single-character edits needed to change
 * one string into the other.
 * It's a classic, textbook implementation of the well-known algorithm.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);

  // Initialize first row
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Similarity score (0-1) derived from Levenshtein distance.
 */
export function calculateSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = calculateLevenshteinDistance(a, b);
  return (maxLen - distance) / maxLen;
}

/****************
 * Matching layers - We're using a layered approach.
 * Starting with exact matches, then very high similarity, then word matches, and finally partial matches.    *
 ***************/

function findHighSimilarityMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const normalizedOriginal = normalizeCompanyName(original, config);
  const results: CompanyMatch[] = [];

  for (const candidate of candidates) {
    if (candidate === original) continue;
    const normalizedCandidate = normalizeCompanyName(candidate, config);
    const score = calculateSimilarity(normalizedOriginal, normalizedCandidate);
    if (score >= config.highSimilarityThreshold) {
      results.push(makeMatch(original, candidate, normalizedOriginal, normalizedCandidate, score, 'high_similarity'));
    }
  }
  return results;
}

function findTokenMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const normalizedOriginal = normalizeCompanyName(original, config);
  const results: CompanyMatch[] = [];

  for (const candidate of candidates) {
    if (candidate === original) continue;
    const normalizedCandidate = normalizeCompanyName(candidate, config);
    const overlap = calculateTokenOverlap(normalizedOriginal, normalizedCandidate);
    if (overlap >= config.tokenMatchThreshold) {
      results.push(makeMatch(original, candidate, normalizedOriginal, normalizedCandidate, overlap, 'token_match'));
    }
  }
  return results;
}

function findPartialMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const normalizedOriginal = normalizeCompanyName(original, config);
  const results: CompanyMatch[] = [];

  for (const candidate of candidates) {
    if (candidate === original) continue;
    const normalizedCandidate = normalizeCompanyName(candidate, config);

    // Check substring relationship
    const shorter = normalizedOriginal.length <= normalizedCandidate.length ? normalizedOriginal : normalizedCandidate;
    const longer = shorter === normalizedOriginal ? normalizedCandidate : normalizedOriginal;

    if (longer.includes(shorter)) {
      const confidence = shorter.length / longer.length;
      if (confidence >= config.partialMatchThreshold) {
        results.push(makeMatch(original, candidate, normalizedOriginal, normalizedCandidate, confidence, 'partial_match'));
      }
    }
  }
  return results;
}

function findExactMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const normalizedOriginal = normalizeCompanyName(original, config);
  const results: CompanyMatch[] = [];

  for (const candidate of candidates) {
    if (candidate === original) continue;
    const normalizedCandidate = normalizeCompanyName(candidate, config);
    if (normalizedCandidate === normalizedOriginal) {
      results.push(makeMatch(original, candidate, normalizedOriginal, normalizedCandidate, 1, 'exact_after_normalization'));
    }
  }
  return results;
}

/**
 * Runs all matching layers and returns unique matches based on confidence order.
 */
export function findAllMatches(
  original: string,
  candidates: string[],
  config: DeduplicationConfig
): CompanyMatch[] {
  const combined: CompanyMatch[] = [];

  combined.push(...findExactMatches(original, candidates, config));
  combined.push(...findHighSimilarityMatches(original, candidates, config));
  combined.push(...findTokenMatches(original, candidates, config));
  combined.push(...findPartialMatches(original, candidates, config));

  const bestMap = new Map<string, CompanyMatch>();
  for (const match of combined) {
    const existing = bestMap.get(match.candidate);
    if (!existing || match.confidence > existing.confidence) {
      bestMap.set(match.candidate, match);
    }
  }

  const unique = Array.from(bestMap.values())
    .filter(m => m.confidence >= config.minConfidenceScore)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, config.maxResultsPerCompany);

  return unique;
}

function makeMatch(
  original: string,
  candidate: string,
  normalizedOriginal: string,
  normalizedCandidate: string,
  confidence: number,
  method: MatchMethod
): CompanyMatch {
  return {
    original,
    candidate,
    confidence: Number(confidence.toFixed(3)),
    method,
    normalizedOriginal,
    normalizedCandidate
  };
} 