import type { Book } from '../types';

/**
 * Option 1: Fetch from Google Sheets published as CSV
 *
 * Steps:
 * 1. In Google Sheets, go to File > Share > Publish to web
 * 2. Select the sheet and choose "Comma-separated values (.csv)"
 * 3. Copy the published URL
 * 4. Use this function with that URL
 *
 * Pros: Simple, no authentication needed
 * Cons: Sheet must be public, less control over caching
 *
 * Note: This is a basic CSV parser. If your data contains commas within
 * fields (like in descriptions), consider:
 * - Using the Google Sheets API (Option 2)
 * - Using a proper CSV parser library (e.g., papaparse: npm install papaparse)
 * - Exporting as JSON instead (Option 3)
 */
export async function fetchBooksFromPublishedCSV(sheetUrl: string): Promise<Book[]> {
  try {
    const response = await fetch(sheetUrl, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sheet data');
    }

    const csv = await response.text();
    const rows = csv.split('\n').filter(row => row.trim());
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

    return rows.slice(1).map(row => {
      const values = row.split(',').map(v => v.trim());
      return {
        title: values[headers.indexOf('title')] || '',
        author: values[headers.indexOf('author')] || '',
        firstPublished: parseInt(values[headers.indexOf('first published')] || '0'),
        category: values[headers.indexOf('category')] || '',
        isbn13: values[headers.indexOf('isbn-13')] || '',
        description: values[headers.indexOf('description')] || '',
        pageCount: parseInt(values[headers.indexOf('page count')] || '0'),
        publisher: values[headers.indexOf('publisher')] || '',
        thumbnail: values[headers.indexOf('thumbnail')] || '',
        buyLink: values[headers.indexOf('buy link')] || '',
      };
    }).filter(book => book.title); // Filter out empty rows
  } catch (error) {
    console.error('Error fetching books from CSV:', error);
    return [];
  }
}

/**
 * Option 2: Fetch from Google Sheets API
 *
 * Requires:
 * 1. Google Cloud project with Sheets API enabled
 * 2. Service account credentials (JSON key file)
 * 3. Share the sheet with the service account email
 *
 * Pros: Private sheets, better error handling, rate limiting
 * Cons: More setup, requires API credentials
 */
export async function fetchBooksFromSheetsAPI(
  sheetId: string,
  range: string = 'Sheet1!A1:J1000'
): Promise<Book[]> {
  // This requires the Google Sheets API client library
  // Install: npm install googleapis
  // You'll need to set up environment variables for credentials

  // Placeholder - implement with googleapis client
  // const { GoogleSpreadsheet } = require('google-spreadsheet');
  // const doc = new GoogleSpreadsheet(sheetId);
  // await doc.useServiceAccountAuth(/* credentials */);
  // await doc.loadInfo();
  // const sheet = doc.sheetsByIndex[0];
  // const rows = await sheet.getRows();
  // return rows.map(row => ({ ... }));

  return [];
}

/**
 * Option 3: Manual JSON export
 *
 * Steps:
 * 1. Export your Google Sheet as JSON manually
 * 2. Place the JSON file in your project (e.g., src/data/books.json)
 * 3. Import and use it directly
 *
 * Pros: Simple, fast, works offline
 * Cons: Manual update process, data not live
 */
// Example usage:
// import booksData from '@/data/books.json';
// const books: Book[] = booksData;

/**
 * Recommended: Use the local JSON file approach instead (see books-data.ts)
 * This keeps your personal Google account private and doesn't require
 * any authentication or public sharing of your sheet.
 *
 * To update data: Export CSV from Google Sheets and run the conversion script
 * See README-DATA.md for instructions
 */
