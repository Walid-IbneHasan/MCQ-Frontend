"use client";

import React from "react";
import { useAuth } from "../../hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  BookOpen,
  Trophy,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Award,
} from "lucide-react";

export default function DashboardPage() {
  const { user, requireAuth } = useAuth();

  if (!requireAuth()) {
    return null;
  }

  const stats = [
    {
      title: "Total Exams",
      value: "24",
      description: "Completed this month",
      icon: Trophy,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Average Score",
      value: "87%",
      description: "+2% from last month",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Study Time",
      value: "45h",
      description: "This week",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Rank",
      value: "#12",
      description: "In your class",
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.first_name || "Student"}!
          </h1>
          <p className="text-muted-foreground">
            Here's your learning progress overview
          </p>
        </div>
        <Button>
          <BookOpen className="h-4 w-4 mr-2" />
          Start New Exam
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <BookOpen className="h-6 w-6" />
              <span>Browse Subjects</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Trophy className="h-6 w-6" />
              <span>Take Practice Test</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>View Progress</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
