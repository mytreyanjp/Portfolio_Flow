
'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { FilterX } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Filters {
  category: string;
}

interface ProjectFilterProps {
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
  onResetFilters: () => void;
  availableCategories: string[]; 
}

export default function ProjectFilter({ filters, onFilterChange, onResetFilters, availableCategories }: ProjectFilterProps) {
  
  const handleCategoryChange = (value: string) => {
    onFilterChange({ ...filters, category: value === 'all' ? '' : value });
  };

  return (
    <Card className="mb-8 bg-transparent shadow-none border-none">
      <CardHeader>
        <CardTitle className="text-2xl">Filter Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <Label htmlFor="category-select" className="text-sm font-medium mb-2 block">Category</Label>
            <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category-select" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={onResetFilters} 
            variant="outline" 
            className={cn(
              "w-full md:w-auto self-end",
              "hover:scale-105 transition-transform duration-200 ease-out hover:bg-background"
            )}
          >
            <FilterX className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
