import Link from "next/link";
import { ArrowRight, GraduationCap, UsersRound, WandSparkles, BellRing } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const principles = [
  { label: "Augment, not automate", desc: "Instructors stay in control at every step." },
  { label: "Transparent team formation", desc: "Every team assignment comes with a rationale." },
  { label: "Instructor override", desc: "Swap students and regenerate rationale instantly." },
  { label: "No permanent labels", desc: "AI outputs are descriptive, never prescriptive." },
  { label: "Privacy by design", desc: "Reflection text is embedded locally before Gemini." },
];

const features = [
  {
    icon: GraduationCap,
    title: "Instructor Control",
    desc: "Seed roster data, generate profiles, form teams, and override assignments with clear rationale at every step.",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: UsersRound,
    title: "Balanced Teaming",
    desc: "Deterministic scoring balances skills, communication styles, availability, leadership, and growth targets.",
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: WandSparkles,
    title: "AI Team Support",
    desc: "Generate charters, summarize meeting notes into action items, and rewrite team messages with the right tone.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: BellRing,
    title: "Proactive Coaching",
    desc: "An autonomous agent monitors team participation, detects disengagement early, and alerts instructors before problems escalate.",
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-10">

      {/* Hero */}
      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-[1.5fr_1fr]">

          {/* Left */}
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">Google Track MVP</Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                Powered by Gemini on Vertex AI
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight leading-tight">
                Build better student teams with{" "}
                <span className="text-blue-600">transparent AI support.</span>
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed max-w-xl">
                Collabor-AI-tor helps instructors gather collaboration signals, form balanced teams,
                and keep teams healthy throughout the semester — all with a human in the loop.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/instructor" className={buttonVariants({})}>
                Open Instructor Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/student/questionnaire" className={buttonVariants({ variant: "outline" })}>
                Open Student Onboarding
              </Link>
            </div>

            <div className="flex gap-6 pt-2 border-t border-slate-100">
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

          {/* Right — principles */}
          <div className="bg-slate-50 border-l border-slate-100 p-8 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Core Principles
            </p>
            <div className="space-y-3">
              {principles.map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="text-blue-500 mr-1.5">✓</span>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400 pl-5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Feature cards */}
      <section>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          What it does
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, color, bg, border }) => (
            <Card key={title} className={`border ${border} ${bg}`}>
              <CardHeader className="pb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white border ${border} mb-1`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-500 leading-relaxed">
                {desc}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
          How it works
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Student Intake", desc: "Students fill a structured form — skills, availability, reflection, and collaboration style." },
            { step: "02", title: "Profile Generation", desc: "Gemini analyzes each intake and generates a structured collaboration profile with risk flags." },
            { step: "03", title: "Team Formation", desc: "A deterministic scorer assigns balanced teams and writes a plain-English rationale for each." },
            { step: "04", title: "Ongoing Support", desc: "The coaching agent monitors participation and alerts instructors when a student goes quiet." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="space-y-2">
              <p className="text-3xl font-bold text-slate-100">{step}</p>
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}