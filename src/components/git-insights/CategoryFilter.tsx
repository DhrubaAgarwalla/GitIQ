'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Filter, X, Tags } from 'lucide-react';
import { COMMIT_CATEGORIES, getCategoryIcon, getCategoryColor, type CommitCategory } from '@/types/commit-categories';

interface CategoryFilterProps {
  selectedCategories: CommitCategory[];
  onCategoriesChange: (categories: CommitCategory[]) => void;
  availableCategories?: CommitCategory[];
}

export function CategoryFilter({
  selectedCategories,
  onCategoriesChange,
  availableCategories = [...COMMIT_CATEGORIES]
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryToggle = (category: CommitCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];

    onCategoriesChange(newCategories);
  };

  const handleSelectAll = () => {
    onCategoriesChange([...availableCategories]);
  };

  const handleClearAll = () => {
    onCategoriesChange([]);
  };

  const selectedCount = selectedCategories.length;
  const totalCount = availableCategories.length;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 border-dashed">
            <Filter className="h-4 w-4 mr-2" />
            Categories
            {selectedCount > 0 && (
              <Separator orientation="vertical" className="mx-2 h-4" />
            )}
            {selectedCount > 0 && (
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selectedCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tags className="h-4 w-4" />
                <span className="font-medium">Filter by Categories</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 px-2 text-xs"
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 px-2 text-xs"
                >
                  None
                </Button>
              </div>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {availableCategories.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  const icon = getCategoryIcon(category);
                  const color = getCategoryColor(category);

                  return (
                    <div
                      key={category}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => handleCategoryToggle(category)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleCategoryToggle(category)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm">{icon}</span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium">{category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {selectedCount > 0 && (
              <>
                <Separator className="my-4" />
                <div className="text-xs text-muted-foreground">
                  {selectedCount} of {totalCount} categories selected
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {selectedCategories.slice(0, 3).map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="text-xs px-2 py-1"
              style={{
                backgroundColor: `${getCategoryColor(category)}20`,
                borderColor: getCategoryColor(category)
              }}
            >
              <span className="mr-1">{getCategoryIcon(category)}</span>
              {category}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategoryToggle(category);
                }}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {selectedCount > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedCount - 3} more
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
