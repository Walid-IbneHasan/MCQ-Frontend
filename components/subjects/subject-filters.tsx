// components/subjects/subject-filters.tsx
"use client";

import React from "react";
import { Search, SortAsc } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent } from "../ui/card";

interface SubjectFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  ordering: string;
  onOrderingChange: (ordering: string) => void;
}

export function SubjectFilters({
  search,
  onSearchChange,
  ordering,
  onOrderingChange,
}: SubjectFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={ordering} onValueChange={onOrderingChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sort_order">Default Order</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="-name">Name (Z-A)</SelectItem>
              <SelectItem value="created_at">Oldest First</SelectItem>
              <SelectItem value="-created_at">Newest First</SelectItem>
              <SelectItem value="-chapters_count">Most Chapters</SelectItem>
              <SelectItem value="-questions_count">Most Questions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
