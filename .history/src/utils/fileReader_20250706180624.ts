/**
 * File reading utilities for company name input
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Reads company names from a text file
 */
export function readCompanyNamesFromFile(filePath: string): string[] {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Split into lines and filter out empty lines
    const companies = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (companies.length === 0) {
      throw new Error('File is empty or contains no valid company names');
    }
    
    return companies;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read company names: ${error.message}`);
    }
    throw new Error('Failed to read company names: Unknown error');
  }
}

/**
 * Writes results to a file
 */
export function writeResultsToFile(filePath: string, content: string): void {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write content to file
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write results: ${error.message}`);
    }
    throw new Error('Failed to write results: Unknown error');
  }
}

/**
 * Validates file path and returns normalized path
 */
export function validateAndNormalizePath(filePath: string): string {
  try {
    return path.resolve(filePath);
  } catch (error) {
    throw new Error(`Invalid file path: ${filePath}`);
  }
}

/**
 * Gets file statistics
 */
export function getFileStats(filePath: string): {
  size: number;
  lines: number;
  exists: boolean;
} {
  try {
    if (!fs.existsSync(filePath)) {
      return { size: 0, lines: 0, exists: false };
    }
    
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    
    return {
      size: stats.size,
      lines,
      exists: true
    };
  } catch (error) {
    return { size: 0, lines: 0, exists: false };
  }
} 