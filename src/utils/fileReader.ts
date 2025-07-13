/**
 * File I/O utilities (synchronous) – keeps implementation simple and
 * requires no async/await for the CLI. We can swap to async later if needed.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * Read a text file and return an array of non-empty, trimmed lines.
 */
export function readCompanyNamesFromFile(filePath: string): string[] {
  const abs = resolve(filePath);
  if (!existsSync(abs)) throw new Error(`Input file not found: ${abs}`);

  const content = readFileSync(abs, 'utf8');
  return content
    .split(/\r?\n/)        // handle LF and CRLF
    .map(line => line.trim())
    .filter(Boolean);       // drop empty lines
}

/**
 * Write any string (results, CSV, JSON) to the given path. Creates parent
 * directory if it doesn’t exist.
 */
export function writeResultsToFile(outPath: string, data: string): void {
  const abs = resolve(outPath);
  const dir = dirname(abs);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(abs, data, 'utf8');
} 