/**
 * Public API entry point.
 *
 * 1.  As a *library* – import from 'company-deduplicator' after compilation:
 *        import { CompanyDeduplicator, createConfig } from 'company-deduplicator';
 *
 * 2.  As a *CLI* – the compiled `dist/index.js` detects if it was invoked
 *     directly (`node dist/index.js ...`) and launches the CLI.
 */

export {
  CompanyDeduplicator
} from './deduplicator';

export {
  CONFIG_PRESETS,
  DEFAULT_CONFIG,
  createConfig,
  validateConfig,
  describeConfig
} from './config';

export type {
  DeduplicationConfig,
  DeduplicationResult,
  DuplicateGroup,
  CompanyMatch,
  ConfigPreset,
  OutputFormat
} from './types';


if (require.main === module) {
  require('./cli');
} 