// components/exams/QuestionSetSelector.tsx (FIXED FOR PAGINATION)
"use client";

import React, { useState } from "react";
import {
  useGetQuestionSetsQuery,
  useGetPopularQuestionSetsQuery,
  useGetQuestionSetQuery,
} from "../../lib/store/api/questionSetsApi";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Search, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface QuestionSetSelectorProps {
  selectedSetId: string | null;
  onSelectSet: (setId: string | null) => void;
  onQuestionsLoaded: (questions: string[]) => void;
}

export function QuestionSetSelector({
  selectedSetId,
  onSelectSet,
  onQuestionsLoaded,
}: QuestionSetSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allSetsData, isLoading: isLoadingAll } =
    useGetQuestionSetsQuery({
      search: searchTerm,
    });

  const { data: popularSetsData, isLoading: isLoadingPopular } =
    useGetPopularQuestionSetsQuery();

  const { data: selectedSetData } = useGetQuestionSetQuery(
    selectedSetId || "",
    {
      skip: !selectedSetId,
    }
  );

  // Extract question sets from the paginated response structure
  const allQuestionSets =
    allSetsData?.results?.question_sets || allSetsData?.question_sets || [];
  const popularQuestionSets =
    popularSetsData?.results?.question_sets ||
    popularSetsData?.question_sets ||
    [];

  const handleSelectSet = async (setId: string) => {
    if (selectedSetId === setId) {
      // Deselect
      onSelectSet(null);
      onQuestionsLoaded([]);
    } else {
      // Select and load questions
      onSelectSet(setId);
    }
  };

  // When selected set data is loaded, populate questions
  React.useEffect(() => {
    if (selectedSetData && selectedSetData.question_set.id === selectedSetId) {
      const questions = selectedSetData.question_set.questions || [];
      onQuestionsLoaded(questions);
    }
  }, [selectedSetData, selectedSetId, onQuestionsLoaded]);

  const QuestionSetCard = ({ set }: { set: any }) => (
    <Card
      key={set.id}
      className={`cursor-pointer transition-all ${
        selectedSetId === set.id
          ? "border-primary ring-2 ring-primary"
          : "hover:border-primary/50"
      }`}
      onClick={() => handleSelectSet(set.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{set.name}</h4>
              {selectedSetId === set.id && (
                <CheckCircle className="h-5 w-5 text-primary" />
              )}
            </div>

            {set.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {set.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary">{set.total_questions} questions</Badge>
              <Badge variant="outline">{set.chapters_count} chapters</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Used {set.usage_count} times
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Created {new Date(set.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Use Existing Question Set</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a saved question set to quickly populate your exam
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Question Sets</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Search */}
            <div>
              <Label>Search Question Sets</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Question Sets List */}
            {isLoadingAll ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : allQuestionSets.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allQuestionSets.map((set: any) => (
                  <QuestionSetCard key={set.id} set={set} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No question sets found. Create your first one by enabling
                    "Create Question Set" when creating an exam.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            {isLoadingPopular ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : popularQuestionSets.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {popularQuestionSets.map((set: any) => (
                  <QuestionSetCard key={set.id} set={set} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No popular question sets yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {selectedSetId && selectedSetData && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <h5 className="font-semibold mb-2">Selected Question Set</h5>
            <p className="text-sm text-muted-foreground mb-2">
              {selectedSetData.question_set.name}
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {selectedSetData.question_set.total_questions} questions loaded
              </Badge>
              {selectedSetData.question_set.chapters_names &&
                selectedSetData.question_set.chapters_names.length > 0 && (
                  <Badge variant="outline">
                    {selectedSetData.question_set.chapters_names
                      .slice(0, 2)
                      .join(", ")}
                    {selectedSetData.question_set.chapters_names.length > 2 &&
                      "..."}
                  </Badge>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
