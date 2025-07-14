# Company Deduplicator

Detects potential duplicate company names in large datasets using a multi-layer fuzzy-matching approach written in TypeScript.

---

## Features

*   String normalisation (case-folding, accent removal, suffix stripping)
*   Four-layer matching engine (exact, Levenshtein similarity, token (word) overlap, partial substring)
*   Configurable presets – **conservative**, **balanced**, **aggressive**
*   Command-line interface (CLI) with JSON / text / CSV output
*   Library API for integration in other Node projects
*   Extensively typed, easily testable codebase

---

## Prerequisites

• Node.js ≥ 18   (Likely 16 would be fine, too. But it's better to avoid edge cases or any potential issues. For instance, Older build might trigger some security prompts.)
• npm (comes with Node) --or-- Yarn

---

##Quick start

unzip company-deduplicator.zip
cd company-deduplicator
npm install      or: yarn
npm run dev examples/companies.txt

---

## CLI usage

```bash
company-dedupe <file> [options]

Options
  --preset <name>            conservative | balanced | aggressive  (default balanced)
  --min-similarity <float>   override highSimilarityThreshold (0-1)
  --min-confidence <float>   override minConfidenceScore (0-1)
  --format <fmt>             text | json | csv  (default text)
  -o, --output <file>        save results instead of printing to stdout
  -v, --verbose              extra logging
  -h, --help                 display help
```

### Example

```bash
# Default run (balanced preset, text output to console)
npm run dev data/companies.txt

# Verbose text output using the conservative preset
npm run dev data/companies.txt --preset conservative --format text -v

# Save JSON results to a file using aggressive preset
npm run dev data/companies.txt --preset aggressive --format json -o duplicates.json

# Save CSV results to a file (balanced preset)
npm run dev data/companies.txt --format csv -o duplicates.csv
```

---

## Configuration presets

| Preset        | High Sim | Token | Partial | Min Confidence | Max results |
|---------------|---------:|------:|--------:|---------------:|------------:|
| Conservative  | 0.92     | 0.88  | 0.85    | 0.85           | 5           |
| Balanced (default)| 0.85 | 0.80  | 0.70    | 0.75           | 10          |
| Aggressive    | 0.78     | 0.70  | 0.60    | 0.60           | 15          |

You can override any field via CLI flags or programmatically.

---

## Library usage

```ts
import { CompanyDeduplicator, createConfig } from 'company-deduplicator';

const companies = [
  'Ubisoft Montreal',
  'Ubisoft Montréal Studio',
  'Ubisoft Canada'
];

const config = createConfig('balanced', { maxResultsPerCompany: 20 });
const deduper = new CompanyDeduplicator(config);
const result = deduper.findDuplicates(companies);
console.log(result);
```

---

## Project structure

```
src/
  cli.ts            # command line interface
  index.ts          # public API & CLI forwarder
  deduplicator.ts   # orchestration engine
  utils/
    normalizer.ts   # normalizing / string cleaning helpers
    matcher.ts      # multi-layer matching algorithms
    fileReader.ts   # file helpers
  config.ts         # configs - presets & validation
  types.ts          # shared TypeScript interfaces
  __tests__/        # Jest test suite
```

---

## Running tests

```bash
npm test (or yarn test)
```

---

## Future improvements

*   Optimise Levenshtein distance with a specialised library (e.g. `fast-levenshtein`) or SIMD.
*   Parallel processing for very large datasets (worker threads or streaming).
*   Machine-learning scoring model to learn weights automatically.
*   Interactive review UI to confirm / reject matches.
*   Configuration via JSON/YAML file instead of CLI flags. 

---

### macOS permission (Catalina+)

On macOS 10.15 (Catalina) and later, Terminal / VS Code OR another editor must be granted access to your folder before Node can read files located there.

```
