import Image from 'next/image';
import { getBooksFromLocalFile } from './lib/books-data';
import { BooksTable } from './books-table';

export default async function PatriotsReadingList() {
  const books = await getBooksFromLocalFile();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-sky-900 to-blue-950">
      <header className="sticky top-0 z-20 bg-blue-950/95 backdrop-blur-sm border-b border-amber-200/30 shadow-lg">
        <div className="px-4 md:px-6 lg:p-2 flex items-center gap-4">
          <Image src="/pixelflag.png" alt="Flag" width={60} height={32} className="object-contain" />
          <h1 className="text-xl md:text-sm text-amber-100 font-semibold">
            Patriot&apos;s American History Reading List
          </h1>
        </div>
      </header>

      <BooksTable books={books} />
    </div>
  );
}
