import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  BellRing,
  GraduationCap,
  UsersRound,
  WandSparkles
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOptionalSessionUser } from "@/lib/auth/session";

const principles = [
  { label: "Augment, not automate", desc: "Instructors stay in control at every step." },
  { label: "Transparent team formation", desc: "Every team assignment comes with a rationale." },
  { label: "Instructor override", desc: "Swap students and regenerate rationale instantly." },
  { label: "No permanent labels", desc: "AI outputs are descriptive, never prescriptive." },
  { label: "Privacy by design", desc: "Reflection text is embedded locally before Gemini." }
];

const features = [
  {
    icon: GraduationCap,
    title: "Instructor Control",
    desc: "Seed roster data, generate profiles, form teams, and override assignments with clear rationale at every step.",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100"
  },
  {
    icon: UsersRound,
    title: "Balanced Teaming",
    desc: "Deterministic scoring balances skills, communication styles, availability, leadership, and growth targets.",
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100"
  },
  {
    icon: WandSparkles,
    title: "AI Team Support",
    desc: "Generate charters, summarize meeting notes into action items, rewrite team messages, and coordinate meeting workflows.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100"
  },
  {
    icon: BellRing,
    title: "Proactive Coaching",
    desc: "An autonomous agent monitors team participation, detects disengagement early, and alerts instructors before problems escalate.",
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100"
  }
];

const workflowSteps = [
  {
    step: "01",
    title: "Roster + Onboarding",
    desc: "Instructors set up the roster and students complete the richer questionnaire instead of the old flat intake."
  },
  {
    step: "02",
    title: "AI Profile Generation",
    desc: "Gemini turns student responses into structured collaboration profiles with readable summaries and risk signals."
  },
  {
    step: "03",
    title: "Deterministic Team Formation",
    desc: "A transparent scoring engine balances skill mix, availability, communication, leadership, and growth fit."
  },
  {
    step: "04",
    title: "Ongoing Team Support",
    desc: "Badges, coaching alerts, charters, meeting summaries, rewrites, and OAuth-backed scheduling keep teams healthy after formation."
  }
];

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getOptionalSessionUser();
  const primaryHref = !user ? "/sign-in" : user.role === "instructor" ? "/instructor" : "/my-team";
  const primaryLabel = !user
    ? "Sign In With Google"
    : user.role === "instructor"
      ? "Open Instructor Dashboard"
      : "Open My Team";

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="grid md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6 p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Google Track MVP</Badge>
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-600"
              >
                Powered by Gemini + Firestore
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight">
                Build better student teams with{" "}
                <span className="text-blue-600">transparent AI support.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-500">
                Collabor-AI-tor helps instructors gather collaboration signals, form balanced
                teams, and keep teams healthy throughout the semester with a human in the loop.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={primaryHref as Route} className={buttonVariants({})}>
                {primaryLabel} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/student/questionnaire"
                className={buttonVariants({ variant: "outline" })}
              >
                Open Student Onboarding
              </Link>
            </div>

            <div className="flex gap-6 border-t border-slate-100 pt-2">
              <div>
                <p className="text-2xl font-semibold text-slate-800">60+</p>
                <p className="text-xs text-slate-400">Students supported</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-800">5</p>
                <p className="text-xs text-slate-400">Scoring dimensions</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-800">0</p>
                <p className="text-xs text-slate-400">Black-box decisions</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-l border-slate-100 bg-slate-50 p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Core Principles
            </p>
            <div className="space-y-3">
              {principles.map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="mr-1.5 text-blue-500">✓</span>
                    {item.label}
                  </p>
                  <p className="pl-5 text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          What it does
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, color, bg, border }) => (
            <Card key={title} className={`border ${border} ${bg}`}>
              <CardHeader className="pb-2">
                <div
                  className={`mb-1 flex h-9 w-9 items-center justify-center rounded-lg border bg-white ${border}`}
                >
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <CardTitle className="text-base font-semibold text-slate-800">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-slate-500">
                {desc}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
          How it works
        </p>
        <div className="grid gap-4 md:grid-cols-4">
          {workflowSteps.map(({ step, title, desc }) => (
            <div key={step} className="space-y-2">
              <p className="text-3xl font-bold text-slate-100">{step}</p>
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
