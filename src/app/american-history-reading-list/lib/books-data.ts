import type { Book } from '../types';

/**
 * Import books from a local JSON file.
 *
 * To update the data:
 * 1. Export your Google Sheet as CSV (File > Download > Comma-separated values)
 * 2. Run the conversion script: node scripts/convert-sheet-to-json.mjs books-export.csv > src/data/books.json
 *
 * See README-DATA.md for detailed instructions
 */

export async function getBooksFromLocalFile(): Promise<Book[]> {
  try {
    // Dynamic import for JSON in Next.js server components
    const booksModule = await import('@/data/books.json');
    // Handle both default export and named export cases
    const booksData = booksModule.default || booksModule;

    // Ensure it's an array
    if (Array.isArray(booksData)) {
      return booksData as Book[];
    }

    // If it's wrapped in an object, try to extract the array
    if (typeof booksData === 'object' && 'books' in booksData) {
      return (booksData as { books: Book[] }).books;
    }

    return [];
  } catch (error) {
    console.error('Error loading books data:', error);
    console.error('Make sure src/data/books.json exists. See README-DATA.md for setup instructions.');
    return [];
  }
}
