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
  Filter,
  Check,
  ChevronDown,
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
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    books.forEach((book) => {
      if (book.category && book.category.trim()) {
        categories.add(book.category);
      }
    });
    return Array.from(categories).sort();
  }, [books]);

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
          <div className="p-3 text-amber-100 font-semibold text-xs leading-snug" style={fontStyle}>
            {row.getValue('title')}
          </div>
        ),
      },
      {
        accessorKey: 'author',
        header: 'Author',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100/90 text-xs leading-snug" style={fontStyle}>
            {row.getValue('author')}
          </div>
        ),
      },
      {
        accessorKey: 'firstPublished',
        header: 'First Published',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100/90 text-xs" style={fontStyle}>
            {row.getValue('firstPublished')}
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <div className="p-3 text-amber-100/90 text-xs leading-snug" style={fontStyle}>
            {row.getValue('category')}
          </div>
        ),
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          const category = row.getValue(columnId) as string;
          return filterValue.includes(category);
        },
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
            <div className="p-3 text-amber-100/80 text-xs leading-relaxed">
              <div className="line-clamp-3">{description}</div>
              {isTruncated && (
                <button
                  onClick={() => setSelectedBook(row.original)}
                  className="mt-3 w-full px-3 py-1.5 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm text-xs font-medium text-center cursor-pointer"
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
                  className="px-3 py-1.5 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm inline-block text-xs font-medium cursor-pointer"
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

  function handleCategoryToggle(category: string) {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);

    const categoryFilter = table.getColumn('category');
    if (newSelected.size === 0) {
      categoryFilter?.setFilterValue(undefined);
    } else {
      categoryFilter?.setFilterValue(Array.from(newSelected));
    }
  }

  function handleClearCategoryFilter() {
    setSelectedCategories(new Set());
    table.getColumn('category')?.setFilterValue(undefined);
  }

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

      const fileName = `american-history-reading-list-${new Date().toISOString().split('T')[0]}.pdf`;
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
      link.setAttribute('download', `american-history-reading-list-${new Date().toISOString().split('T')[0]}.csv`);
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
      {/* Search Bar, Category Filter, and Download Buttons */}
      <div className="mb-2 flex flex-col gap-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center md:justify-between gap-4">
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-200/60 hover:text-amber-200 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              style={fontStyle}
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              style={fontStyle}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="relative">
          {/* Desktop: Dropdown */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
              className={`w-full px-4 py-2 bg-amber-200/10 border rounded-xs text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${
                selectedCategories.size > 0
                  ? 'border-amber-200/70 bg-amber-200/20 text-amber-100'
                  : 'border-amber-200/30 text-amber-100/90 hover:border-amber-200/50 hover:bg-amber-200/15'
              }`}
              style={fontStyle}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-200/60" />
                <span>
                  {selectedCategories.size === 0
                    ? 'Filter by Category'
                    : `${selectedCategories.size} categor${selectedCategories.size === 1 ? 'y' : 'ies'} selected`}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-amber-200/60 transition-transform ${isCategoryFilterOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isCategoryFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCategoryFilterOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-blue-950 border border-amber-200/30 rounded-xs shadow-xl z-50 max-h-[400px] overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-amber-200/20 flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider" style={fontStyle}>
                      Categories
                    </span>
                    {selectedCategories.size > 0 && (
                      <button
                        onClick={handleClearCategoryFilter}
                        className="text-xs text-amber-200/70 hover:text-amber-200 transition-colors cursor-pointer"
                        style={fontStyle}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgb(255_237_213_/_0.4)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-blue-950/40 [&::-webkit-scrollbar-thumb]:bg-amber-200/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-amber-200/60">
                    {uniqueCategories.map((category) => {
                      const isSelected = selectedCategories.has(category);
                      return (
                        <button
                          key={category}
                          onClick={() => handleCategoryToggle(category)}
                          className={`w-full px-4 py-2.5 text-left text-xs flex items-start gap-3 hover:bg-amber-200/10 transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-200/15' : ''
                          }`}
                          style={fontStyle}
                        >
                          <div
                            className={`mt-0.5 flex-shrink-0 w-4 h-4 border rounded-xs flex items-center justify-center transition-all ${
                              isSelected ? 'bg-amber-200/30 border-amber-200/70' : 'border-amber-200/40 bg-transparent'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-amber-100" />}
                          </div>
                          <span
                            className={`flex-1 leading-relaxed ${isSelected ? 'text-amber-100' : 'text-amber-100/80'}`}
                          >
                            {category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile: Button that opens modal */}
          <div className="md:hidden">
            <button
              onClick={() => setIsCategoryFilterOpen(true)}
              className={`w-full px-4 py-2 bg-amber-200/10 border rounded-xs text-xs font-medium flex items-center justify-between gap-2 cursor-pointer ${
                selectedCategories.size > 0
                  ? 'border-amber-200/70 bg-amber-200/20 text-amber-100'
                  : 'border-amber-200/30 text-amber-100/90'
              }`}
              style={fontStyle}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-200/60" />
                <span>
                  {selectedCategories.size === 0
                    ? 'Filter by Category'
                    : `${selectedCategories.size} categor${selectedCategories.size === 1 ? 'y' : 'ies'} selected`}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-200/60" />
            </button>
          </div>
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
            className="p-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-200/20 text-xs transition-all hover:border-amber-200/70 hover:shadow-sm cursor-pointer"
            style={fontStyle}
            aria-label="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-200/20 text-xs transition-all hover:border-amber-200/70 hover:shadow-sm cursor-pointer"
            style={fontStyle}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-200/20 text-xs transition-all hover:border-amber-200/70 hover:shadow-sm cursor-pointer"
            style={fontStyle}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-200/20 text-xs transition-all hover:border-amber-200/70 hover:shadow-sm cursor-pointer"
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

      {/* Category Filter Modal (Mobile) */}
      {isCategoryFilterOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm"
          onClick={() => setIsCategoryFilterOpen(false)}
        >
          <div
            className="bg-blue-950 border-t border-amber-200/30 rounded-t-lg shadow-2xl flex-1 flex flex-col mt-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b border-amber-200/20 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-200/60" />
                <h3 className="text-sm font-semibold text-amber-100 uppercase tracking-wider" style={fontStyle}>
                  Filter by Category
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {selectedCategories.size > 0 && (
                  <button
                    onClick={handleClearCategoryFilter}
                    className="text-xs text-amber-200/70 hover:text-amber-200 transition-colors cursor-pointer"
                    style={fontStyle}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsCategoryFilterOpen(false)}
                  className="p-1 text-amber-200/60 hover:text-amber-200 hover:bg-amber-200/10 rounded-xs transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgb(255_237_213_/_0.4)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-blue-950/40 [&::-webkit-scrollbar-thumb]:bg-amber-200/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-amber-200/60">
              {uniqueCategories.map((category) => {
                const isSelected = selectedCategories.has(category);
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`w-full px-4 py-3 text-left text-sm flex items-start gap-3 hover:bg-amber-200/10 transition-colors border-b border-amber-200/10 cursor-pointer ${
                      isSelected ? 'bg-amber-200/15' : ''
                    }`}
                    style={fontStyle}
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 border rounded-xs flex items-center justify-center transition-all ${
                        isSelected ? 'bg-amber-200/30 border-amber-200/70' : 'border-amber-200/40 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-100" />}
                    </div>
                    <span className={`flex-1 leading-relaxed ${isSelected ? 'text-amber-100' : 'text-amber-100/80'}`}>
                      {category}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-4 border-t border-amber-200/20 flex-shrink-0">
              <button
                onClick={() => setIsCategoryFilterOpen(false)}
                className="w-full px-4 py-2.5 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm text-sm font-semibold cursor-pointer"
                style={fontStyle}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedBook(null)}
        >
          <div
            className="bg-blue-950 border-0 md:border border-amber-200/30 rounded-none md:rounded-xs shadow-2xl w-full h-full md:w-[900px] md:h-[600px] overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Panel - Thumbnail */}
            <div className="flex-shrink-0 w-full h-64 md:h-auto md:w-80 md:w-96 relative border-b md:border-b-0 md:border-r border-amber-200/20">
              {selectedBook.thumbnail && selectedBook.thumbnail.trim() && isValidUrl(selectedBook.thumbnail) ? (
                <Image
                  src={selectedBook.thumbnail}
                  alt={selectedBook.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
              ) : (
                <div className="w-full h-full bg-amber-200/10 flex items-center justify-center">
                  <span className="text-amber-200/40 text-xs text-center px-2" style={fontStyle}>
                    No image
                  </span>
                </div>
              )}
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Header with Blurred Background */}
              <div className="relative px-4 md:px-6 py-3 md:py-4 border-b border-amber-200/20">
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
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-semibold text-amber-100 mb-1" style={fontStyle}>
                      {selectedBook.title}
                    </h2>
                    <p className="text-xs md:text-sm text-amber-200/80" style={fontStyle}>
                      by {selectedBook.author}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="p-2 text-amber-200/60 hover:text-amber-200 hover:bg-amber-200/10 rounded-xs transition-colors z-10 cursor-pointer flex-shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 md:px-6 py-3 md:py-4 overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:rgb(255_237_213_/_0.4)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-blue-950/40 [&::-webkit-scrollbar-thumb]:bg-amber-200/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-amber-200/60">
                <div className="text-amber-100/90 text-sm leading-relaxed whitespace-pre-wrap" style={fontStyle}>
                  {selectedBook.description}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 md:px-6 py-3 md:py-4 border-t border-amber-200/20 flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
                <div className="flex flex-col gap-1 text-xs text-amber-200/70" style={fontStyle}>
                  {selectedBook.category && <span>{selectedBook.category}</span>}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    {selectedBook.firstPublished && <span>Published: {selectedBook.firstPublished}</span>}
                    {selectedBook.pageCount && <span>{selectedBook.pageCount} pages</span>}
                  </div>
                </div>
                {selectedBook.buyLink && (
                  <a
                    href={selectedBook.buyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto px-4 py-2 bg-amber-200/20 hover:bg-amber-200/30 text-amber-100 rounded-xs border border-amber-200/50 transition-all hover:border-amber-200/70 hover:shadow-sm text-sm font-medium text-center md:text-left md:whitespace-nowrap flex-shrink-0 cursor-pointer"
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
