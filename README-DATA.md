# Updating the Reading List Data

To keep your personal Google account private, the reading list uses a local JSON file instead of connecting directly to Google Sheets.

## Quick Update Process

1. **Export from Google Sheets**
   - Open your Google Sheet
   - Go to File > Download > Comma-separated values (.csv)
   - Save the file (e.g., `readinglist.csv`)

2. **Convert to JSON**
   ```bash
   node scripts/convert-sheet-to-json.mjs readinglist.csv src/data/books.json
   ```

3. **Fetch Thumbnails (Optional)**
   ```bash
   node scripts/fetch-thumbnails.mjs
   ```
   This will fetch book cover thumbnails from Google Books API for any books missing thumbnails. The script automatically creates a backup before updating.

4. **Commit the update**
   ```bash
   git add src/data/books.json
   git commit -m "Update reading list"
   ```

That's it! The site will use the updated data on the next build.

## Alternative: Manual JSON Creation

If you prefer, you can edit `src/data/books.json` directly. The structure should match:

```json
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "firstPublished": 2024,
    "category": "Category",
    "isbn13": "9781234567890",
    "description": "Book description...",
    "pageCount": 300,
    "publisher": "Publisher Name",
    "thumbnail": "https://example.com/image.jpg",
    "buyLink": "https://example.com/buy"
  }
]
```

## CSV Column Mapping

The converter script automatically maps common column names:
- Title → `title`
- Author → `author`
- First Published / FirstPublished → `firstPublished`
- Category → `category`
- ISBN-13 / ISBN13 / ISBN → `isbn13`
- Description → `description`
- Page Count / PageCount / Pages → `pageCount`
- Publisher → `publisher`
- Thumbnail / Image → `thumbnail`
- Buy Link / BuyLink / Link / URL → `buyLink`

## Fetching Book Thumbnails

The `fetch-thumbnails.mjs` script automatically fetches book cover images from the Google Books API:

- **Free**: No API key required for basic usage
- **Automatic**: Only fetches thumbnails for books that don't have one
- **Safe**: Creates a backup before making changes
- **Rate Limited**: Includes delays to avoid hitting API rate limits

The script uses ISBN-13 numbers to look up books. If a book doesn't have an ISBN or the API doesn't find a match, it will skip that book.

**Note**: Google Books API has rate limits. For large lists (100+ books), the script may take a few minutes to complete.

## Privacy Benefits

- ✅ No connection to your personal Google account
- ✅ No API keys or authentication needed (for thumbnail fetching)
- ✅ Data is version controlled in your repository
- ✅ Works offline and doesn't depend on external services (after thumbnails are fetched)
- ✅ You control when and how often data is updated
