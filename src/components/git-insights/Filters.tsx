
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, EraserIcon } from 'lucide-react';
import { format, isValid } from 'date-fns';
import type { DateRange } from 'react-day-picker';


interface FiltersProps {
  authors: string[];
  onFilterChange: (filters: { author?: string; message?: string; dateRange?: DateRange }) => void;
  onSortChange: (sort: { by: 'date' | 'author'; order: 'asc' | 'desc' }) => void;
  currentFilters: { author: string; message: string; dateRange?: DateRange };
  currentSort: { by: 'date' | 'author'; order: 'asc' | 'desc' };
  onResetFilters: () => void;
}

export function Filters({
  authors,
  onFilterChange,
  onSortChange,
  currentFilters,
  currentSort,
  onResetFilters,
}: FiltersProps) {

  const handleAuthorChange = (value: string) => {
    onFilterChange({ ...currentFilters, author: value === 'all' ? '' : value });
  };

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...currentFilters, message: event.target.value });
  };

  const handleDateRangeChange = (dateRange?: DateRange) => {
    onFilterChange({ ...currentFilters, dateRange });
  };

  const handleSortByChange = (value: 'date' | 'author') => {
    onSortChange({ ...currentSort, by: value });
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    onSortChange({ ...currentSort, order: value });
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-xl font-semibold text-primary mb-4">Filter & Sort Commits</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="author-filter">Author</Label>
          <Select onValueChange={handleAuthorChange} value={currentFilters.author || 'all'}>
            <SelectTrigger id="author-filter">
              <SelectValue placeholder="Filter by author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author} value={author}>
                  {author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="message-filter">Commit Message</Label>
          <Input
            id="message-filter"
            type="text"
            placeholder="Search in messages..."
            value={currentFilters.message}
            onChange={handleMessageChange}
          />
        </div>
      </div>



      <div>
        <Label htmlFor="date-range-filter">Date Range</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-range-filter"
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentFilters.dateRange?.from && isValid(currentFilters.dateRange.from) ? (
                currentFilters.dateRange.to && isValid(currentFilters.dateRange.to) ? (
                  <>
                    {format(currentFilters.dateRange.from, 'LLL dd, y')} - {format(currentFilters.dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(currentFilters.dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={currentFilters.dateRange?.from}
              selected={currentFilters.dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sort-by">Sort By</Label>
          <Select onValueChange={handleSortByChange} value={currentSort.by}>
            <SelectTrigger id="sort-by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="author">Author</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sort-order">Order</Label>
          <Select onValueChange={handleSortOrderChange} value={currentSort.order}>
            <SelectTrigger id="sort-order">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={onResetFilters} variant="outline" className="w-full">
        <EraserIcon className="mr-2 h-4 w-4" /> Reset Filters & Sort
      </Button>
    </div>
  );
}
