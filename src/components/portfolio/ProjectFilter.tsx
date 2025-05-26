'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { categories, allTechnologies, Project } from '@/data/projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { FilterX } from 'lucide-react';


export interface Filters {
  category: string;
  technologies: string[];
}

interface ProjectFilterProps {
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
  onResetFilters: () => void;
}

export default function ProjectFilter({ filters, onFilterChange, onResetFilters }: ProjectFilterProps) {
  
  const handleCategoryChange = (value: string) => {
    onFilterChange({ ...filters, category: value === 'all' ? '' : value });
  };

  const handleTechnologyChange = (tech: string, checked: boolean) => {
    const newTechnologies = checked
      ? [...filters.technologies, tech]
      : filters.technologies.filter((t) => t !== tech);
    onFilterChange({ ...filters, technologies: newTechnologies });
  };

  return (
    <Card className="mb-8 shadow-lg">
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
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onResetFilters} variant="outline" className="w-full md:w-auto">
            <FilterX className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </div>
        
        <div>
          <Label className="text-sm font-medium mb-2 block">Technologies</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allTechnologies.map((tech) => (
              <div key={tech} className="flex items-center space-x-2 bg-card p-3 rounded-md border hover:bg-accent/10">
                <Checkbox
                  id={`tech-${tech}`}
                  checked={filters.technologies.includes(tech)}
                  onCheckedChange={(checked) => handleTechnologyChange(tech, !!checked)}
                />
                <Label htmlFor={`tech-${tech}`} className="text-sm font-normal cursor-pointer">
                  {tech}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
