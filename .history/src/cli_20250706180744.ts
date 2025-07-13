#!/usr/bin/env node

/**
 * Command-line interface for company deduplication
 */

import { CompanyDeduplicator } from './deduplicator';
import { CliOptions, ConfigPreset, OutputFormat } from './types';
import { readCompanyNamesFromFile, writeResultsToFile, getFileStats } from './utils/fileReader';
import { getConfigSummary } from './config';

/**
 * Parses command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  
  const options: CliOptions = {
    inputFile: ''
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      
      case '--preset':
        if (i + 1 < args.length) {
          const preset = args[++i] as ConfigPreset;
          if (['conservative', 'balanced', 'aggressive'].includes(preset)) {
            options.preset = preset;
          } else {
            console.error(`Invalid preset: ${preset}`);
            process.exit(1);
          }
        } else {
          console.error('--preset requires a value');
          process.exit(1);
        }
        break;
      
      case '--min-similarity':
        if (i + 1 < args.length) {
          const value = parseFloat(args[++i]);
          if (value >= 0 && value <= 1) {
            options.minSimilarity = value;
          } else {
            console.error('--min-similarity must be between 0 and 1');
            process.exit(1);
          }
        } else {
          console.error('--min-similarity requires a value');
          process.exit(1);
        }
        break;
      
      case '--min-confidence':
        if (i + 1 < args.length) {
          const value = parseFloat(args[++i]);
          if (value >= 0 && value <= 1) {
            options.minConfidence = value;
          } else {
            console.error('--min-confidence must be between 0 and 1');
            process.exit(1);
          }
        } else {
          console.error('--min-confidence requires a value');
          process.exit(1);
        }
        break;
      
      case '--format':
        if (i + 1 < args.length) {
          const format = args[++i] as OutputFormat;
          if (['json', 'text', 'csv'].includes(format)) {
            options.format = format;
          } else {
            console.error(`Invalid format: ${format}`);
            process.exit(1);
          }
        } else {
          console.error('--format requires a value');
          process.exit(1);
        }
        break;
      
      case '--output':
      case '-o':
        if (i + 1 < args.length) {
          options.outputFile = args[++i];
        } else {
          console.error('--output requires a value');
          process.exit(1);
        }
        break;
      
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        } else {
          // Input file
          options.inputFile = arg;
        }
    }
  }
  
  if (!options.inputFile) {
    console.error('Input file is required');
    showHelp();
    process.exit(1);
  }
  
  return options;
}

/**
 * Shows help information
 */
function showHelp(): void {
  console.log(`
Company Deduplicator - Find potential duplicate company names

Usage: npm run dev <input-file> [options]

Arguments:
  <input-file>            Path to text file containing company names (one per line)

Options:
  --preset <preset>       Use predefined configuration preset
                          Options: conservative, balanced, aggressive
                          Default: balanced
  
  --min-similarity <num>  Minimum similarity threshold (0-1)
                          Overrides preset high similarity threshold
  
  --min-confidence <num>  Minimum confidence score to include in results (0-1)
                          Default: 0.75
  
  --format <format>       Output format
                          Options: json, text, csv
                          Default: text
  
  --output <file>         Output file path
  -o <file>               If not specified, results are printed to console
  
  --verbose               Show detailed processing information
  -v
  
  --help                  Show this help message
  -h

Examples:
  npm run dev companies.txt
  npm run dev companies.txt --preset conservative
  npm run dev companies.txt --min-similarity 0.8 --format json
  npm run dev companies.txt --preset aggressive --output results.txt
  npm run dev companies.txt --verbose --format csv --output duplicates.csv

Presets:
  conservative: High precision, fewer false positives (85% min confidence)
  balanced:     Good balance of precision and recall (75% min confidence)
  aggressive:   High recall, more potential matches (60% min confidence)
`);
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();
    
    // Show file statistics if verbose
    if (options.verbose) {
      const stats = getFileStats(options.inputFile);
      console.log(`Input file: ${options.inputFile}`);
      console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`Number of lines: ${stats.lines}`);
      console.log('');
    }
    
    // Read company names
    console.log('Reading company names...');
    const companies = readCompanyNamesFromFile(options.inputFile);
    
    // Create deduplicator with configuration
    const deduplicator = new CompanyDeduplicator();
    
    // Apply preset if specified
    if (options.preset) {
      deduplicator.setPreset(options.preset);
    }
    
    // Apply custom overrides
    if (options.minSimilarity !== undefined || options.minConfidence !== undefined) {
      const currentConfig = deduplicator.getConfig();
      const overrides: any = {};
      
      if (options.minSimilarity !== undefined) {
        overrides.highSimilarityThreshold = options.minSimilarity;
      }
      
      if (options.minConfidence !== undefined) {
        overrides.minConfidenceScore = options.minConfidence;
      }
      
      deduplicator.setConfig({ ...currentConfig, ...overrides });
    }
    
    // Show configuration if verbose
    if (options.verbose) {
      console.log(getConfigSummary(deduplicator.getConfig()));
      console.log('');
    }
    
    // Process companies
    console.log(`Processing ${companies.length} companies...`);
    const result = deduplicator.findDuplicates(companies);
    
    // Show processing results
    console.log(`Found ${result.duplicateGroups.length} duplicate groups`);
    console.log(`Processing time: ${result.processingTimeMs}ms`);
    
    // Analyze results if verbose
    if (options.verbose) {
      const analysis = deduplicator.analyzeResults(result);
      console.log('\nAnalysis:');
      console.log(`Total duplicate groups: ${analysis.totalGroups}`);
      console.log(`Total duplicates found: ${analysis.totalDuplicates}`);
      console.log(`Average group size: ${analysis.averageGroupSize.toFixed(2)}`);
      
      if (analysis.largestGroup) {
        console.log(`Largest group: "${analysis.largestGroup.original}" (${analysis.largestGroup.totalMatches} matches)`);
      }
      
      console.log('\nConfidence Distribution:');
      Object.entries(analysis.confidenceDistribution).forEach(([range, count]) => {
        console.log(`  ${range}: ${count}`);
      });
      
      console.log('\nMethod Distribution:');
      Object.entries(analysis.methodDistribution).forEach(([method, count]) => {
        console.log(`  ${method}: ${count}`);
      });
    }
    
    // Format and output results
    const format = options.format || 'text';
    const output = deduplicator.exportResults(result, format);
    
    if (options.outputFile) {
      writeResultsToFile(options.outputFile, output);
      console.log(`Results saved to: ${options.outputFile}`);
    } else {
      console.log('\n' + '='.repeat(60));
      console.log(output);
    }
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main, parseArgs, showHelp }; 