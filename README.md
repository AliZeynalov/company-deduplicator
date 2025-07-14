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

## Installation

```bash
# clone and install
npm install

# compile TypeScript → dist/
npm run build
```

During development you can run the CLI without compiling:

```bash
npm run dev <file> [options]
```

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
npm run dev data/companies.txt \
  --preset conservative \
  --format text -v
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
  cli.ts            # command-line interface
  index.ts          # public API & CLI forwarder
  deduplicator.ts   # orchestration engine
  utils/
    normalizer.ts   # string cleaning helpers
    matcher.ts      # multi-layer matching algorithms
    fileReader.ts   # small sync file helpers
  config.ts         # presets & validation
  types.ts          # shared TypeScript interfaces
  __tests__/        # Jest test suite
```

---

## Running tests

```bash
npm test
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
