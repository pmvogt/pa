#!/usr/bin/env node

/**
 * Script to fetch book thumbnails from Google Books API and update books.json
 *
 * Usage:
 *   node scripts/fetch-thumbnails.mjs
 *
 * This script:
 * 1. Reads src/data/books.json
 * 2. For each book without a thumbnail, tries multiple search strategies:
 *    - ISBN-13 search
 *    - ISBN-10 search (converted from ISBN-13)
 *    - Title + Author search
 *    - Title-only search
 * 3. Updates the thumbnail field with the best available image
 * 4. Saves the updated JSON file
 *
 * Note: Google Books API is free but has rate limits. This script includes delays
 * to avoid hitting rate limits.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeISBN(isbn) {
  if (!isbn) return null;
  // Remove hyphens and spaces
  return isbn.replace(/[-\s]/g, '');
}

function convertISBN13ToISBN10(isbn13) {
  if (!isbn13 || isbn13.length !== 13) return null;
  // Remove the 978 prefix and last digit (check digit)
  const isbn10 = isbn13.substring(3, 12);
  // Calculate check digit for ISBN-10
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn10[i]) * (10 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 11;
  return isbn10 + (checkDigit === 10 ? 'X' : checkDigit.toString());
}

function extractThumbnail(data) {
  if (!data.items || data.items.length === 0) return null;

  // Try to find the best match with an image
  for (const item of data.items) {
    const volumeInfo = item.volumeInfo;
    const imageLinks = volumeInfo?.imageLinks;

    if (imageLinks) {
      // Prefer thumbnail, fallback to smallThumbnail, then medium, then large
      const thumbnail =
        imageLinks.thumbnail ||
        imageLinks.smallThumbnail ||
        imageLinks.medium ||
        imageLinks.large ||
        imageLinks.extraLarge;

      if (thumbnail) {
        // Replace http with https and remove zoom parameters for better quality
        return thumbnail.replace(/^http:/, 'https:').replace(/&zoom=\d+/, '');
      }
    }
  }

  return null;
}

async function searchGoogleBooks(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=5`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited, wait longer
        await sleep(1000);
        return null;
      }
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

async function fetchThumbnailFromGoogleBooks(book) {
  const { isbn13, title, author } = book;

  // Strategy 1: Try ISBN-13 search
  if (isbn13) {
    const normalizedISBN = normalizeISBN(isbn13);
    if (normalizedISBN) {
      const data = await searchGoogleBooks(`isbn:${normalizedISBN}`);
      if (data) {
        const thumbnail = extractThumbnail(data);
        if (thumbnail) return thumbnail;
      }

      // Strategy 2: Try ISBN-10 if ISBN-13 is 13 digits
      if (normalizedISBN.length === 13) {
        const isbn10 = convertISBN13ToISBN10(normalizedISBN);
        if (isbn10) {
          const data = await searchGoogleBooks(`isbn:${isbn10}`);
          if (data) {
            const thumbnail = extractThumbnail(data);
            if (thumbnail) return thumbnail;
          }
        }
      }
    }
  }

  // Strategy 3: Try title + author search
  if (title && author) {
    const searchQuery = `intitle:"${title}"+inauthor:"${author}"`;
    const data = await searchGoogleBooks(searchQuery);
    if (data) {
      const thumbnail = extractThumbnail(data);
      if (thumbnail) return thumbnail;
    }
  }

  // Strategy 4: Try title-only search
  if (title) {
    const searchQuery = `intitle:"${title}"`;
    const data = await searchGoogleBooks(searchQuery);
    if (data) {
      const thumbnail = extractThumbnail(data);
      if (thumbnail) return thumbnail;
    }
  }

  return null;
}

async function main() {
  const booksPath = resolve(__dirname, '..', 'src', 'data', 'books.json');
  const backupPath = resolve(__dirname, '..', 'src', 'data', 'books.json.backup');

  console.log('📚 Fetching book thumbnails from Google Books API\n');

  // Read existing books
  let books;
  try {
    const booksData = readFileSync(booksPath, 'utf-8');
    books = JSON.parse(booksData);
  } catch (error) {
    console.error('❌ Error reading books.json:', error.message);
    process.exit(1);
  }

  // Create backup
  try {
    writeFileSync(backupPath, JSON.stringify(books, null, 2), 'utf-8');
    console.log(`✓ Created backup: ${backupPath}\n`);
  } catch (error) {
    console.warn('⚠️  Could not create backup:', error.message);
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const hasThumbnail = book.thumbnail && book.thumbnail.trim() !== '';
    const hasISBN = book.isbn13 && book.isbn13.trim() !== '';

    if (hasThumbnail) {
      console.log(`[${i + 1}/${books.length}] ✓ ${book.title} - Already has thumbnail`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${books.length}] 🔍 ${book.title} - Fetching thumbnail...`);
    const thumbnail = await fetchThumbnailFromGoogleBooks(book);

    if (thumbnail) {
      book.thumbnail = thumbnail;
      updated++;
      console.log(`  ✓ Found thumbnail: ${thumbnail.substring(0, 60)}...`);
    } else {
      failed++;
      const searchMethods = [];
      if (book.isbn13) searchMethods.push('ISBN');
      if (book.title && book.author) searchMethods.push('Title+Author');
      if (book.title) searchMethods.push('Title');
      console.log(`  ✗ No thumbnail found (tried: ${searchMethods.join(', ')})`);
    }

    // Rate limiting: wait 200ms between requests to avoid hitting rate limits
    // Longer delay if we had to try multiple search strategies
    if (i < books.length - 1) {
      await sleep(200);
    }
  }

  // Save updated books
  try {
    writeFileSync(booksPath, JSON.stringify(books, null, 2), 'utf-8');
    console.log(`\n✅ Updated ${books.length} books`);
    console.log(`   ✓ Updated: ${updated}`);
    console.log(`   ⊘ Skipped: ${skipped}`);
    console.log(`   ✗ Failed: ${failed}`);
    console.log(`\n📁 Saved to: ${booksPath}`);
  } catch (error) {
    console.error('❌ Error writing books.json:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
