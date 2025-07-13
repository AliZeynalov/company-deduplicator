/**
 * Main company deduplication engine
 */

import { 
  DeduplicationConfig, 
  DeduplicationResult, 
  DuplicateGroup, 
  CompanyMatch,
  ConfigPreset 
} from './types';
import { findAllMatches } from './utils/matcher';
import { DEFAULT_CONFIG, createConfigFromPreset, createCustomConfig, validateConfig } from './config';

/**
 * Main class for company deduplication
 */
export class CompanyDeduplicator {
  private config: DeduplicationConfig;
  
  constructor(config: DeduplicationConfig = DEFAULT_CONFIG) {
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid configuration: ${validationErrors.join(', ')}`);
    }
    this.config = config;
  }
  
  /**
   * Updates the configuration
   */
  setConfig(config: DeduplicationConfig): void {
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid configuration: ${validationErrors.join(', ')}`);
    }
    this.config = config;
  }
  
  /**
   * Updates configuration from preset
   */
  setPreset(preset: ConfigPreset): void {
    this.config = createConfigFromPreset(preset);
  }
  
  /**
   * Updates configuration with custom overrides
   */
  setCustomConfig(basePreset: ConfigPreset, overrides: Partial<DeduplicationConfig>): void {
    this.config = createCustomConfig(basePreset, overrides);
  }
  
  /**
   * Gets current configuration
   */
  getConfig(): DeduplicationConfig {
    return { ...this.config };
  }
  
  /**
   * Finds duplicate companies in the provided list
   */
  findDuplicates(companies: string[]): DeduplicationResult {
    const startTime = Date.now();
    
    // Remove empty strings and duplicates
    const uniqueCompanies = [...new Set(companies.filter(name => name.trim().length > 0))];
    
    const duplicateGroups: DuplicateGroup[] = [];
    const processedCompanies = new Set<string>();
    
    // Process each company
    for (let i = 0; i < uniqueCompanies.length; i++) {
      const company = uniqueCompanies[i];
      
      // Skip if already processed as part of another group
      if (processedCompanies.has(company)) {
        continue;
      }
      
      // Find matches for this company
      const matches = findAllMatches(company, uniqueCompanies, this.config);
      
      if (matches.length > 0) {
        // Create duplicate group
        const duplicateGroup: DuplicateGroup = {
          original: company,
          duplicates: matches,
          totalMatches: matches.length
        };
        
        duplicateGroups.push(duplicateGroup);
        
        // Mark all companies in this group as processed
        processedCompanies.add(company);
        matches.forEach(match => processedCompanies.add(match.candidate));
      }
    }
    
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;
    
    return {
      totalCompanies: uniqueCompanies.length,
      duplicateGroups,
      processingTimeMs,
      config: this.config
    };
  }
  
  /**
   * Finds duplicates for a single company against a list of candidates
   */
  findDuplicatesForCompany(company: string, candidates: string[]): CompanyMatch[] {
    const uniqueCandidates = [...new Set(candidates.filter(name => name.trim().length > 0))];
    return findAllMatches(company, uniqueCandidates, this.config);
  }
  
  /**
   * Analyzes the deduplication results and provides statistics
   */
  analyzeResults(result: DeduplicationResult): {
    totalGroups: number;
    totalDuplicates: number;
    averageGroupSize: number;
    largestGroup: DuplicateGroup | null;
    confidenceDistribution: { [key: string]: number };
    methodDistribution: { [key: string]: number };
  } {
    const totalGroups = result.duplicateGroups.length;
    const totalDuplicates = result.duplicateGroups.reduce((sum, group) => sum + group.totalMatches, 0);
    const averageGroupSize = totalGroups > 0 ? totalDuplicates / totalGroups : 0;
    
    // Find largest group
    const largestGroup = result.duplicateGroups.reduce((largest, group) => 
      !largest || group.totalMatches > largest.totalMatches ? group : largest,
      null as DuplicateGroup | null
    );
    
    // Analyze confidence distribution
    const confidenceDistribution: { [key: string]: number } = {
      'Very High (90-100%)': 0,
      'High (80-89%)': 0,
      'Medium (70-79%)': 0,
      'Low (60-69%)': 0,
      'Very Low (<60%)': 0
    };
    
    // Analyze method distribution
    const methodDistribution: { [key: string]: number } = {
      'exact_after_normalization': 0,
      'high_similarity': 0,
      'token_match': 0,
      'partial_match': 0
    };
    
    result.duplicateGroups.forEach(group => {
      group.duplicates.forEach(match => {
        // Confidence distribution
        if (match.confidence >= 0.9) {
          confidenceDistribution['Very High (90-100%)']++;
        } else if (match.confidence >= 0.8) {
          confidenceDistribution['High (80-89%)']++;
        } else if (match.confidence >= 0.7) {
          confidenceDistribution['Medium (70-79%)']++;
        } else if (match.confidence >= 0.6) {
          confidenceDistribution['Low (60-69%)']++;
        } else {
          confidenceDistribution['Very Low (<60%)']++;
        }
        
        // Method distribution
        methodDistribution[match.method]++;
      });
    });
    
    return {
      totalGroups,
      totalDuplicates,
      averageGroupSize,
      largestGroup,
      confidenceDistribution,
      methodDistribution
    };
  }
  
  /**
   * Exports results to different formats
   */
  exportResults(result: DeduplicationResult, format: 'json' | 'csv' | 'text'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);
      
      case 'csv':
        return this.exportToCsv(result);
      
      case 'text':
        return this.exportToText(result);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
  
  /**
   * Exports results to CSV format
   */
  private exportToCsv(result: DeduplicationResult): string {
    const headers = ['Original Company', 'Duplicate Company', 'Confidence', 'Method', 'Normalized Original', 'Normalized Duplicate'];
    const rows = [headers.join(',')];
    
    result.duplicateGroups.forEach(group => {
      group.duplicates.forEach(match => {
        const row = [
          this.escapeCsvValue(match.original),
          this.escapeCsvValue(match.candidate),
          match.confidence.toFixed(3),
          match.method,
          this.escapeCsvValue(match.normalizedOriginal),
          this.escapeCsvValue(match.normalizedCandidate)
        ];
        rows.push(row.join(','));
      });
    });
    
    return rows.join('\n');
  }
  
  /**
   * Exports results to human-readable text format
   */
  private exportToText(result: DeduplicationResult): string {
    const lines: string[] = [];
    
    lines.push('Company Deduplication Results');
    lines.push('================================');
    lines.push('');
    lines.push(`Total Companies: ${result.totalCompanies}`);
    lines.push(`Duplicate Groups Found: ${result.duplicateGroups.length}`);
    lines.push(`Processing Time: ${result.processingTimeMs}ms`);
    lines.push('');
    
    result.duplicateGroups.forEach((group, index) => {
      lines.push(`Group ${index + 1}: ${group.original}`);
      lines.push('-'.repeat(50));
      
      group.duplicates.forEach(match => {
        lines.push(`  → ${match.candidate}`);
        lines.push(`    Confidence: ${(match.confidence * 100).toFixed(1)}%`);
        lines.push(`    Method: ${match.method}`);
        lines.push('');
      });
      
      lines.push('');
    });
    
    return lines.join('\n');
  }
  
  /**
   * Escapes CSV values
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
} 