
'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { categories } from '@/data/projects'; // allTechnologies is no longer needed here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { FilterX } from 'lucide-react';
// DropdownMenu related imports are no longer needed if technologies filter is removed
// import { ChevronDown } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

export interface Filters {
  category: string;
  technologies: string[]; // Keep this in the interface for now, as other parts of the app might rely on it
}

interface ProjectFilterProps {
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
  onResetFilters: () => void;
}

export default function ProjectFilter({ filters, onFilterChange, onResetFilters }: ProjectFilterProps) {
  
  const handleCategoryChange = (value: string) => {
    // When category changes, we still pass the existing technologies filter, even if UI to change it is removed
    onFilterChange({ ...filters, category: value === 'all' ? '' : value });
  };

  // handleTechnologyChange and selectedTechnologiesText are no longer needed here

  return (
    <Card className="mb-8 bg-transparent shadow-none border-none">
      <CardHeader>
        <CardTitle className="text-2xl">Filter Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end"> {/* Adjusted grid to md:grid-cols-2 */}
          <div>
            <Label htmlFor="category-select" className="text-sm font-medium mb-2 block">Category</Label>
            <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category-select" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Technologies Dropdown Removed */}

          <Button onClick={onResetFilters} variant="outline" className="w-full md:w-auto self-end">
            <FilterX className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
