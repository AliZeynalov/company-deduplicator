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

// ---------------------------------------------------------------------------
// If this file is executed directly (e.g. `node dist/index.js file.txt`) we
// delegate to the CLI so users get the same behaviour whether they call
// `dist/cli.js` or `dist/index.js`.
// ---------------------------------------------------------------------------
console.log('index.ts: ', require.main);
if (require.main === module) {
  // dynamic import avoids circular dependency at compile-time
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./cli');
} 