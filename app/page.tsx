import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import Link from "next/link";
import { BookOpen, Users, Trophy, BarChart3 } from "lucide-react";
import { ROUTES } from "../lib/utils/constants";

export default function HomePage() {
  const features = [
    {
      icon: BookOpen,
      title: "Rich Question Bank",
      description:
        "Access thousands of carefully curated MCQ questions across various subjects.",
    },
    {
      icon: Users,
      title: "Student Management",
      description:
        "Comprehensive tools for managing students, tracking progress, and analyzing performance.",
    },
    {
      icon: Trophy,
      title: "Competitive Exams",
      description:
        "Take timed exams and compete with peers on interactive leaderboards.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "Detailed insights and analytics to help improve learning outcomes.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 auth-gradient">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Master Your Knowledge with{" "}
              <span className="text-primary">Smart MCQ Exams</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 animate-fade-in">
              Take practice tests, track your progress, and excel in your
              studies with our comprehensive online examination platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button size="lg" asChild>
                <Link href={ROUTES.REGISTER}>Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.LOGIN}>Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container px-4 mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              Our platform provides all the tools and features you need for
              effective online learning and assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center h-full hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container px-4 mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of students who are already improving their
              knowledge with our platform.
            </p>
            <Button size="lg" asChild>
              <Link href={ROUTES.REGISTER}>Create Your Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
