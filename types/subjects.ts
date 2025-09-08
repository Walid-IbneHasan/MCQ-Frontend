export interface Subject {
  id: string;
  name: string;
  description: string;
  code: string;
  is_active: boolean;
  sort_order: number;
  image?: string;
  chapters_count: number;
  questions_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  subject: string;
  subject_name: string;
  name: string;
  description: string;
  chapter_number: number;
  is_active: boolean;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  questions_count: number;
  exams_count: number;
  created_at: string;
  updated_at: string;
  subject_detail?: Subject;
}

export interface SubjectsResponse {
  success: boolean;
  subjects: Subject[];
}

export interface ChaptersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Chapter[];
}

export interface SubjectChaptersResponse {
  success: boolean;
  subject: Subject;
  chapters: Chapter[];
}