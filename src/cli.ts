#!/usr/bin/env node

/**
 * CLI entry – run `ts-node src/cli.ts <input-file> [options]` during dev, or
 * `node dist/cli.js` after building. Parses a handful of flags and produces
 * text / JSON / CSV output.
 */

import { CompanyDeduplicator } from './deduplicator';
import { readCompanyNamesFromFile, writeResultsToFile } from './utils/fileReader';
import { createConfig, describeConfig } from './config';
import { ConfigPreset, OutputFormat } from './types';

interface ParsedArgs {
  file: string;
  preset: ConfigPreset;
  minSim?: number;
  minConf?: number;
  format: OutputFormat;
  out?: string;
  verbose: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // skip node + script
  const out: ParsedArgs = {
    file: '',
    preset: 'balanced',
    format: 'text',
    verbose: false,
    help: false
  } as ParsedArgs;

  const pop = () => {
    if (args.length === 0) throw new Error('Missing value for flag');
    return args.shift() as string;
  };

  while (args.length) {
    const arg = args.shift() as string;
    switch (arg) {
      case '-h':
      case '--help':
        out.help = true;
        return out;
      case '--preset':
        out.preset = pop() as ConfigPreset;
        break;
      case '--min-similarity':
        out.minSim = Number(pop());
        break;
      case '--min-confidence':
        out.minConf = Number(pop());
        break;
      case '--format':
        out.format = pop() as OutputFormat;
        break;
      case '-o':
      case '--output':
        out.out = pop();
        break;
      case '-v':
      case '--verbose':
        out.verbose = true;
        break;
      default:
        if (arg.startsWith('-')) throw new Error(`Unknown flag: ${arg}`);
        if (!out.file) out.file = arg;
        else throw new Error('Multiple input files specified');
    }
  }
  return out;
}

function showHelp(): void {
  console.log(`Company Deduplicator – CLI Guide\n\nUsage: company-deduplicate <file> [options]\n\nOptions:\n  --preset <name>            conservative | balanced | aggressive  (default balanced)\n  --min-similarity <float>   override highSimilarityThreshold (0-1)\n  --min-confidence <float>   override minConfidenceScore (0-1)\n  --format <fmt>             text | json | csv  (default text)\n  -o, --output <file>        save results to file instead of stdout\n  -v, --verbose              extra logging\n  -h, --help                 show this message\n`);
}

/** Entry point  */
function main(): void {
  let args: ParsedArgs;
  try {
    console.log('\nprocess.argv: ', process.argv);
    args = parseArgs(process.argv);
  } catch (err) {
    console.error('Argument error:', (err as Error).message);
    showHelp();
    process.exit(1);
    return;
  }

  console.log('\nparsed args (configs): ', args);

  if (args.help || !args.file) {
    showHelp();
    return;
  }

  const companies = readCompanyNamesFromFile(args.file);
  console.log('\ncompanies: ', companies);
  if (args.verbose) console.log(`Loaded ${companies.length} companies`);

  // Build configuration
  const overrides: any = {};
  if (args.minSim !== undefined) overrides.highSimilarityThreshold = args.minSim;
  if (args.minConf !== undefined) overrides.minConfidenceScore = args.minConf;
  const config = createConfig(args.preset, overrides);

  if (args.verbose) console.log('\n' + describeConfig(config) + '\n');

  const deduplicatorEngine = new CompanyDeduplicator(config);
  const result = deduplicatorEngine.findDuplicates(companies);

  if (args.verbose) {
    console.log(`Found ${result.duplicateGroups.length} duplicate groups in ${result.processingTimeMs}ms\n`);
  }

  // Convert result to chosen format
  let output = '';
  switch (args.format) {
    case 'json':
      output = JSON.stringify(result, null, 2);
      break;
    case 'csv': {
      const lines: string[] = ['Original,Duplicate,Confidence'];
      result.duplicateGroups.forEach(g => {
        g.duplicates.forEach(d => {
          lines.push(`"${g.original}","${d.candidate}",${d.confidence}`);
        });
      });
      output = lines.join('\n');
      break;
    }
    default: // text
      result.duplicateGroups.forEach(g => {
        output += `\n${g.original}\n`;
        g.duplicates.forEach(d => {
          output += `  -> ${d.candidate}  (${(d.confidence*100).toFixed(1)}%)\n`;
        });
      });
  }

  if (args.out) {
    writeResultsToFile(args.out, output);
    if (args.verbose) {
      console.log(`Results written to ${args.out}`);
    }
  } else {
    
    console.log(output);
  }
}

console.log('cli.ts: ', require.main?.id);


if (require.main === module) {
  main();  // this means its being run directly, not imported or something as part of some script.
} 