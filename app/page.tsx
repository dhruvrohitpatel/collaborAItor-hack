import Link from "next/link";
import { ArrowRight, GraduationCap, UsersRound, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const principles = [
  "Augment, not automate",
  "Transparent team formation",
  "Instructor override",
  "Descriptive AI outputs"
];

export default function LandingPage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 rounded-2xl border bg-white p-8 shadow-sm md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Badge variant="secondary">Google Track Hackathon MVP</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">
            Build better student teams with transparent AI support.
          </h1>
          <p className="max-w-2xl text-slate-600">
            Collabor-AI-tor helps instructors gather collaboration signals, generate structured
            profiles, form balanced teams, and provide practical team support tools.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/instructor" className={buttonVariants({})}>
              Open Instructor Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/student/questionnaire" className={buttonVariants({ variant: "outline" })}>
              Open Student Onboarding
            </Link>
          </div>
        </div>
        <Card className="border-sky-200 bg-sky-50/60">
          <CardHeader>
            <CardTitle>Core Principles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {principles.map((item) => (
              <p key={item} className="text-sm text-slate-700">
                • {item}
              </p>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-primary" /> Instructor Control
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Seed roster data, generate profiles, form teams, and override assignments with clear
            rationale.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersRound className="h-5 w-5 text-primary" /> Balanced Teaming
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Deterministic heuristic scoring balances skills, communication styles, availability,
            leadership, and growth fit.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <WandSparkles className="h-5 w-5 text-primary" /> AI Team Support
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Generate charters, summarize meeting notes into action items, and rewrite professional
            team messages.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
