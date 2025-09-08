// components/subjects/subject-card.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, FileText, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { Subject } from '../../types/subjects';
import { useDeleteSubjectMutation } from '../../lib/store/api/subjectsApi';
import { useToastContext } from '../../lib/providers/toast-provider';

interface SubjectCardProps {
  subject: Subject;
  isCompact?: boolean;
  showActions?: boolean;
}

export function SubjectCard({ subject, isCompact = false, showActions = false }: SubjectCardProps) {
  const { toast } = useToastContext();
  const [deleteSubject, { isLoading: isDeleting }] = useDeleteSubjectMutation();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      try {
        await deleteSubject(subject.id).unwrap();
        toast({
          title: 'Success',
          description: 'Subject deleted successfully',
          variant: 'success',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete subject',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className={isCompact ? 'pb-3' : undefined}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {subject.image ? (
                <Image
                  src={subject.image}
                  alt={subject.name}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
              ) : (
                <BookOpen className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{subject.name}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {subject.code}
              </Badge>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/subjects/${subject.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {!isCompact && (
          <CardDescription className="line-clamp-2">
            {subject.description || 'No description available'}
          </CardDescription>
        )}
      </CardHeader>

      {!isCompact && (
        <CardContent>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {subject.chapters_count} chapters
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {subject.questions_count} questions
            </span>
          </div>
        </CardContent>
      )}

      <CardFooter className={isCompact ? 'pt-0' : undefined}>
        <Button asChild className="w-full">
          <Link href={`/subjects/${subject.id}`}>
            {isCompact ? 'View' : 'Explore Chapters'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}