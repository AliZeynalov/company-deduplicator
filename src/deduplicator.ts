import {
  DeduplicationConfig,
  DeduplicationResult,
  DuplicateGroup,
  CompanyMatch,
  ConfigPreset
} from './types';

import { DEFAULT_CONFIG, createConfig, validateConfig } from './config';
import { findAllMatches } from './utils/matcher';

export class CompanyDeduplicator {
  private config: DeduplicationConfig;

  constructor(config: DeduplicationConfig = DEFAULT_CONFIG) {
    const errs = validateConfig(config);
    if (errs.length) {
     throw new Error(`Invalid config: ${errs.join(', ')}`);
    }
    this.config = { ...config };
  }

  getConfig(): DeduplicationConfig {
    return { ...this.config };
  }

  /** Replace configuration entirely (validates first). */
  setConfig(newCfg: DeduplicationConfig): void {
    const errs = validateConfig(newCfg);
    if (errs.length) throw new Error(`Invalid config: ${errs.join(', ')}`);
    this.config = { ...newCfg };
  }

  usePreset(preset: ConfigPreset, overrides: Partial<DeduplicationConfig> = {}): void {
    this.setConfig(createConfig(preset, overrides));
  }

  /**
   * Find duplicates for ALL companies in the given list.
   - Remove empty/whitespace lines.
   – De-duplicates the input list itself.
   – Returns grouped matches & timing info.
   */
  findDuplicates(companies: string[]): DeduplicationResult {
    const start = Date.now();

    const uniqueCompanies = [...new Set(companies.map(c => c.trim()).filter(Boolean))];
    console.log('\nunique companies: ', uniqueCompanies);
    const processed = new Set<string>();
    const groups: DuplicateGroup[] = [];

    for (const company of uniqueCompanies) {
      if (processed.has(company)) continue;

      const matches = findAllMatches(company, uniqueCompanies, this.config);
      if (matches.length) {
        groups.push({
          original: company,
          duplicates: matches,
          totalMatches: matches.length
        });
        // mark original + all candidates
        processed.add(company);
        matches.forEach(m => processed.add(m.candidate));
      }
    }

    return {
      totalCompanies: uniqueCompanies.length,
      duplicateGroups: groups,
      processingTimeMs: Date.now() - start,
      config: this.getConfig()
    };
  }

  findDuplicatesForCompany(company: string, candidates: string[]): CompanyMatch[] {
    const cleaned = candidates.map(c => c.trim()).filter(Boolean);
    return findAllMatches(company, cleaned, this.config);
  }
} 