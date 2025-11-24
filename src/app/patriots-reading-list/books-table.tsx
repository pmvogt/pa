'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import type { Book } from './types';

function isValidUrl(urlString: string): boolean {
  try {
    if (urlString.startsWith('/')) {
      return true;
    }
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const fontStyle = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };

interface BooksTableProps {
  books: Book[];
}

export function BooksTable({ books }: BooksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'title', desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const columns = useMemo<ColumnDef<Book>[]>(
    () => [
      {
        accessorKey: 'thumbnail',
        header: 'Thumbnail',
        cell: ({ row }) => {
          const thumbnail = row.original.thumbnail;
          return (
            <div className="p-3 flex items-center justify-center">
              {thumbnail && thumbnail.trim() && isValidUrl(thumbnail) ? (
                <Image
                  src={thumbnail}
                  alt={row.original.title}
                  width={60}
                  height={90}
                  className="object-cover rounded-xs shadow-sm border border-amber-200/20"
                />
              ) : (
                <div className="w-[60px] h-[90px] bg-amber-200/10 border border-dashed border-amber-200/30 rounded-xs flex items-center justify-center">
                  <span className="text-amber-200/50 text-[10px] text-center px-1" style={fontStyle}>
                    No image
                  </span>
                </div>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100 font-semibold text-sm leading-snug" style={fontStyle}>
            {row.getValue('title')}
          </div>
        ),
      },
      {
        accessorKey: 'author',
        header: 'Author',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100/90 text-sm leading-snug" style={fontStyle}>
            {row.getValue('author')}
          </div>
        ),
      },
      {
        accessorKey: 'firstPublished',
        header: 'First Published',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100/90 text-sm" style={fontStyle}>
            {row.getValue('firstPublished')}
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100/90 text-sm leading-snug" style={fontStyle}>
            {row.getValue('category')}
          </div>
        ),
      },
      {
        accessorKey: 'isbn13',
        header: 'ISBN-13',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100/90 text-sm font-mono" style={fontStyle}>
            {row.getValue('isbn13')}
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const description = row.getValue('description') as string;
          const isTruncated = description && description.length > 150;
          return (
            <div className="p-3 text-amber-100/80 text-sm leading-relaxed">
              <div className="line-clamp-3">{description}</div>
              {isTruncated && (
                <button
                  onClick={() => setSelectedBook(row.original)}
                  className="mt-3 w-full px-3 py-1.5 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm text-xs font-medium text-center"
                  style={fontStyle}
                >
                  Read full description
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'pageCount',
        header: 'Pages',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100/90 text-sm" style={fontStyle}>
            {row.getValue('pageCount')}
          </div>
        ),
      },
      {
        accessorKey: 'publisher',
        header: 'Publisher',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100/90 text-sm leading-snug" style={fontStyle}>
            {row.getValue('publisher')}
          </div>
        ),
      },
      {
        accessorKey: 'buyLink',
        header: 'Buy Link',
        cell: ({ row }) => {
          const buyLink = row.original.buyLink;
          return (
            <div className="p-3">
              {buyLink && (
                <a
                  href={buyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm inline-block text-xs font-medium"
                  style={fontStyle}
                >
                  Buy
                </a>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: books,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: String(globalFilter ?? ''),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    enableSorting: true,
    enableFilters: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    initialState: {
      sorting: [{ id: 'title', desc: false }],
      pagination: {
        pageSize: 50,
      },
    },
  });

  function handleExportPDF() {
    try {
      const doc = new jsPDF('landscape');
      const filteredRows = table.getFilteredRowModel().rows;

      if (filteredRows.length === 0) {
        alert('No books to export. Please adjust your filters.');
        return;
      }

      const tableData = filteredRows.map((row) => {
        const book = row.original;
        return [
          book.title || '',
          book.author || '',
          book.firstPublished?.toString() || '',
          book.category || '',
          book.isbn13 || '',
          book.description?.substring(0, 100) + (book.description && book.description.length > 100 ? '...' : '') || '',
          book.pageCount?.toString() || '',
          book.publisher || '',
        ];
      });

      const headers = [
        'Title',
        'Author',
        'First Published',
        'Category',
        'ISBN-13',
        'Description',
        'Pages',
        'Publisher',
      ];

      doc.setFontSize(16);
      doc.text("Patriot's American History Reading List", 14, 15);

      doc.setFontSize(10);
      const filterText = globalFilter ? `Filtered: "${globalFilter}"` : 'All books';
      const dateText = `Generated: ${new Date().toLocaleDateString()}`;
      doc.text(filterText, 14, 22);
      doc.text(dateText, 14, 27);
      doc.text(`Total: ${filteredRows.length} books`, 14, 32);

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 35,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [13, 42, 148], // Blue-950 color
          textColor: [255, 237, 213], // Amber-100 color
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Title
          1: { cellWidth: 35 }, // Author
          2: { cellWidth: 20 }, // First Published
          3: { cellWidth: 25 }, // Category
          4: { cellWidth: 25 }, // ISBN-13
          5: { cellWidth: 60 }, // Description
          6: { cellWidth: 15 }, // Pages
          7: { cellWidth: 30 }, // Publisher
        },
        margin: { top: 35 },
      });

      const fileName = `patriots-reading-list-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }

  function handleExportCSV() {
    try {
      const filteredRows = table.getFilteredRowModel().rows;

      if (filteredRows.length === 0) {
        alert('No books to export. Please adjust your filters.');
        return;
      }

      const headers = [
        'Title',
        'Author',
        'First Published',
        'Category',
        'ISBN-13',
        'Description',
        'Page Count',
        'Publisher',
        'Thumbnail',
        'Buy Link',
      ];

      const csvRows = [
        headers.join(','),
        ...filteredRows.map((row) => {
          const book = row.original;
          return [
            `"${(book.title || '').replace(/"/g, '""')}"`,
            `"${(book.author || '').replace(/"/g, '""')}"`,
            book.firstPublished?.toString() || '',
            `"${(book.category || '').replace(/"/g, '""')}"`,
            book.isbn13 || '',
            `"${(book.description || '').replace(/"/g, '""')}"`,
            book.pageCount?.toString() || '',
            `"${(book.publisher || '').replace(/"/g, '""')}"`,
            book.thumbnail || '',
            book.buyLink || '',
          ].join(',');
        }),
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `patriots-reading-list-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate CSV. Please try again.');
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] p-4 md:p-6 lg:p-4">
      {/* Search Bar and Download Buttons */}
      <div className="mb-2 flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-shrink-0">
        <div className="relative w-full md:flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-200/60" />
          <input
            type="text"
            value={String(globalFilter ?? '')}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            className="w-full pl-10 pr-10 py-2 text-xs font-medium bg-amber-200/10 border border-amber-200/30 rounded-xs text-amber-100 placeholder:text-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-200/50 focus:border-amber-200/50 transition-all"
            style={fontStyle}
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-200/60 hover:text-amber-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm text-xs font-semibold flex items-center justify-center gap-2"
            style={fontStyle}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm text-xs font-semibold flex items-center justify-center gap-2"
            style={fontStyle}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Table Container with Sticky Header */}
      <div className="bg-blue-950/50 rounded-xs border border-amber-200/20 shadow-lg overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1 [scrollbar-width:thin] [scrollbar-color:rgb(255_237_213_/_0.4)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-blue-950/40 [&::-webkit-scrollbar-thumb]:bg-amber-200/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-amber-200/60">
          <div className="h-full overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgb(255_237_213_/_0.4)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-blue-950/40 [&::-webkit-scrollbar-thumb]:bg-amber-200/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-amber-200/60">
            <table className="w-full border-collapse" style={{ tableLayout: 'auto' }}>
              <thead className="sticky top-0 z-10 bg-blue-950/95 backdrop-blur-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-amber-200/40">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left px-2 py-1 text-amber-100 text-xs font-semibold uppercase tracking-wider"
                        style={fontStyle}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? 'cursor-pointer select-none hover:text-amber-50 flex items-center gap-2 group'
                                : ''
                            }
                            onClick={header.column.getToggleSortingHandler()}
                            role="button"
                            tabIndex={header.column.getCanSort() ? 0 : -1}
                            onKeyDown={(e) => {
                              if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                header.column.toggleSorting();
                              }
                            }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="text-amber-200/60 group-hover:text-amber-200 transition-colors">
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ArrowDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="p-8 text-center text-amber-100/60 text-sm"
                      style={fontStyle}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <p className="font-medium">No books found</p>
                        {globalFilter && <p className="text-xs text-amber-200/40">Try adjusting your search terms</p>}
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-amber-200/20 hover:bg-amber-200/5 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
        <div className="flex items-center gap-2" style={fontStyle}>
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-200/20 text-xs transition-all hover:border-amber-200/70 hover:shadow-sm"
            style={fontStyle}
            aria-label="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-200/20 text-xs transition-all hover:border-amber-200/70 hover:shadow-sm"
            style={fontStyle}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-200/20 text-xs transition-all hover:border-amber-200/70 hover:shadow-sm"
            style={fontStyle}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-200/20 text-xs transition-all hover:border-amber-200/70 hover:shadow-sm"
            style={fontStyle}
            aria-label="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-amber-100/90 text-sm font-medium" style={fontStyle}>
            Page <span className="text-amber-100">{table.getState().pagination.pageIndex + 1}</span> of{' '}
            <span className="text-amber-100">{table.getPageCount()}</span>
          </div>
          <div className="text-amber-100/90 text-sm" style={fontStyle}>
            Showing <span className="text-amber-100 font-medium">{table.getRowModel().rows.length}</span> of{' '}
            <span className="text-amber-100 font-medium">{table.getFilteredRowModel().rows.length}</span> books
          </div>
        </div>
      </div>

      {/* Description Modal */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedBook(null)}
        >
          <div
            className="bg-blue-950 border border-amber-200/30 rounded-xs shadow-2xl w-[900px] h-[600px] overflow-hidden flex"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Panel - Thumbnail */}
            <div className="flex-shrink-0 w-80 md:w-96 relative">
              {selectedBook.thumbnail && selectedBook.thumbnail.trim() && isValidUrl(selectedBook.thumbnail) ? (
                <Image
                  src={selectedBook.thumbnail}
                  alt={selectedBook.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 320px, 384px"
                />
              ) : (
                <div className="w-full h-full bg-amber-200/10 border-r border-amber-200/20 flex items-center justify-center">
                  <span className="text-amber-200/40 text-xs text-center px-2" style={fontStyle}>
                    No image
                  </span>
                </div>
              )}
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Header with Blurred Background */}
              <div className="relative px-6 py-4 border-b border-amber-200/20">
                {/* Blurred Background Image */}
                {selectedBook.thumbnail && selectedBook.thumbnail.trim() && isValidUrl(selectedBook.thumbnail) && (
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={selectedBook.thumbnail}
                      alt=""
                      fill
                      className="object-cover scale-150 blur-2xl opacity-30"
                      sizes="100vw"
                      aria-hidden="true"
                    />
                    <div className="absolute inset-0 bg-blue-950/80" />
                  </div>
                )}
                {/* Header Content */}
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-amber-100 mb-1" style={fontStyle}>
                      {selectedBook.title}
                    </h2>
                    <p className="text-sm text-amber-200/80" style={fontStyle}>
                      by {selectedBook.author}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="p-2 text-amber-200/60 hover:text-amber-200 hover:bg-amber-200/10 rounded-xs transition-colors z-10"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4 overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:rgb(255_237_213_/_0.4)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-blue-950/40 [&::-webkit-scrollbar-thumb]:bg-amber-200/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-amber-200/60">
                <div className="text-amber-100/90 text-sm leading-relaxed whitespace-pre-wrap" style={fontStyle}>
                  {selectedBook.description}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-amber-200/20 flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 text-xs text-amber-200/70" style={fontStyle}>
                  {selectedBook.category && <span>{selectedBook.category}</span>}
                  <div className="flex items-center gap-4">
                    {selectedBook.firstPublished && <span>Published: {selectedBook.firstPublished}</span>}
                    {selectedBook.pageCount && <span>{selectedBook.pageCount} pages</span>}
                  </div>
                </div>
                {selectedBook.buyLink && (
                  <a
                    href={selectedBook.buyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm text-sm font-medium whitespace-nowrap flex-shrink-0"
                    style={fontStyle}
                  >
                    Buy Book
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
