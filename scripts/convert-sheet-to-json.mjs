#!/usr/bin/env node

/**
 * Script to convert Google Sheets CSV export to JSON format for the reading list.
 *
 * Usage:
 * 1. Export your Google Sheet as CSV (File > Download > Comma-separated values)
 * 2. Save it somewhere (e.g., books-export.csv)
 * 3. Run: node scripts/convert-sheet-to-json.mjs books-export.csv > src/data/books.json
 *
 * Or pipe it directly:
 * node scripts/convert-sheet-to-json.mjs < books-export.csv > src/data/books.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseCSV(csvText) {
  // Use papaparse to properly parse CSV with quoted fields
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    console.error('CSV parsing errors:', result.errors);
  }

  // Map header names to our Book interface fields
  const headerMap = {
    title: 'title',
    author: 'author',
    firstpublished: 'firstPublished',
    'first published': 'firstPublished',
    category: 'category',
    'isbn-13': 'isbn13',
    isbn13: 'isbn13',
    isbn: 'isbn13',
    description: 'description',
    pagecount: 'pageCount',
    'page count': 'pageCount',
    pages: 'pageCount',
    publisher: 'publisher',
    thumbnail: 'thumbnail',
    image: 'thumbnail',
    buylink: 'buyLink',
    'buy link': 'buyLink',
    link: 'buyLink',
    url: 'buyLink',
  };

  return result.data
    .map((row) => {
      const book = {};

      // Map each field from the CSV row to the book object
      Object.keys(row).forEach((csvKey) => {
        const mappedKey = headerMap[csvKey] || csvKey;
        const value = row[csvKey];

        // Type conversion
        if (mappedKey === 'firstPublished' || mappedKey === 'pageCount') {
          book[mappedKey] = parseInt(value) || 0;
        } else {
          book[mappedKey] = value || '';
        }
      });

      return book;
    })
    .filter((book) => book.title && book.title.trim() !== ''); // Filter empty rows
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/convert-sheet-to-json.mjs <input.csv> [output.json]');
    console.error('   or: cat input.csv | node scripts/convert-sheet-to-json.mjs > output.json');
    process.exit(1);
  }

  let csvText;
  if (args[0] === '-' || !args[0].endsWith('.csv')) {
    // Read from stdin
    csvText = readFileSync(0, 'utf-8');
  } else {
    // Read from file
    csvText = readFileSync(args[0], 'utf-8');
  }

  const books = parseCSV(csvText);
  const json = JSON.stringify(books, null, 2);

  if (args[1]) {
    // Write to specified output file
    const outputPath = resolve(__dirname, '..', args[1]);
    writeFileSync(outputPath, json, 'utf-8');
    console.error(`✓ Converted ${books.length} books to ${args[1]}`);
  } else {
    // Write to stdout
    console.log(json);
  }
}

main();
