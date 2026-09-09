import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Check,
  GraduationCap,
  Orbit,
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
    desc: "Seed roster data, generate profiles, form teams, and override assignments with clear rationale at every step."
  },
  {
    icon: UsersRound,
    title: "Balanced Teaming",
    desc: "Deterministic scoring balances skills, communication styles, availability, leadership, and growth targets."
  },
  {
    icon: WandSparkles,
    title: "AI Team Support",
    desc: "Generate charters, summarize meeting notes into action items, rewrite team messages, and coordinate meeting workflows."
  },
  {
    icon: BellRing,
    title: "Proactive Coaching",
    desc: "An autonomous agent monitors team participation, detects disengagement early, and alerts instructors before problems escalate."
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
    <div className="space-y-8 md:space-y-14">
      <section className="framer-panel relative overflow-hidden rounded-[24px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,153,255,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
        <div className="relative grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10 xl:p-14">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Google Track MVP</Badge>
              <Badge variant="outline">Powered by Gemini + Firestore</Badge>
            </div>

            <div className="space-y-5">
              <p className="framer-kicker">Transparent Team Formation</p>
              <h1 className="framer-display max-w-4xl text-[3.25rem] md:text-[5.4rem] xl:text-[6.6rem]">
                Better student teams, built on a pure black control surface.
              </h1>
              <p className="framer-body max-w-2xl text-base md:text-lg">
                Collabor-AI-tor helps instructors collect collaboration signals, generate readable
                student profiles, form balanced teams, and keep group work healthy without giving
                up human control.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={primaryHref as Route} className={buttonVariants({ size: "lg" })}>
                {primaryLabel} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/student/questionnaire"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Open Student Onboarding
              </Link>
            </div>

            <div className="grid gap-4 pt-2 md:grid-cols-3">
              <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Students supported
                </p>
                <p className="mt-3 [font-family:var(--font-display)] text-4xl font-medium tracking-[-0.06em]">
                  60+
                </p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Scoring dimensions
                </p>
                <p className="mt-3 [font-family:var(--font-display)] text-4xl font-medium tracking-[-0.06em]">
                  5
                </p>
              </div>
              <div className="rounded-[18px] border border-[rgba(0,153,255,0.2)] bg-[rgba(0,153,255,0.08)] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Black-box decisions
                </p>
                <p className="mt-3 [font-family:var(--font-display)] text-4xl font-medium tracking-[-0.06em]">
                  0
                </p>
              </div>
            </div>
          </div>

          <div className="framer-grid rounded-[24px] border border-white/10 bg-[#050505] p-4 md:p-5">
            <div className="framer-panel rounded-[20px] p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="framer-kicker">Instructor Surface</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                    Team formation cockpit
                  </p>
                </div>
                <div className="rounded-full border border-[rgba(0,153,255,0.2)] bg-[rgba(0,153,255,0.08)] p-2 text-[#0099ff]">
                  <Orbit className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[18px] border border-white/10 bg-black/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Pipeline</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#0099ff]">Live</p>
                  </div>
                  <div className="grid gap-3">
                    {workflowSteps.map(({ step, title }) => (
                      <div
                        key={step}
                        className="flex items-center justify-between rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs uppercase tracking-[0.2em] text-white/35">
                            {step}
                          </span>
                          <span className="text-sm text-white/82">{title}</span>
                        </div>
                        <Check className="h-3.5 w-3.5 text-[#0099ff]" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                      AI Assistance
                    </p>
                    <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">
                      Profile summaries, charters, rewrites, meeting notes.
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[rgba(0,153,255,0.2)] bg-[rgba(0,153,255,0.08)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                      Rationale Output
                    </p>
                    <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">
                      Every assignment stays explainable and overrideable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="framer-kicker">What it does</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-medium leading-none tracking-[-0.07em] md:text-6xl">
              A product-first workflow for instructors and teams.
            </h2>
          </div>
          <Link
            href={"/tools" as Route}
            className="hidden items-center gap-2 text-sm text-white/65 transition hover:text-white md:inline-flex"
          >
            Explore AI tools <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card
              key={title}
              className="border-[rgba(0,153,255,0.15)] bg-[#090909] text-white"
            >
              <CardHeader className="pb-3">
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6">
                  <Icon className="h-5 w-5 text-[#0099ff]" />
                </div>
                <CardTitle className="text-xl font-semibold text-white">{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-sm leading-relaxed text-white/62">
                <p>{desc}</p>
                <div className="h-px w-full bg-white/8" />
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/38">
                  {title === "Instructor Control"
                    ? "Human-in-the-loop decisions"
                    : title === "Balanced Teaming"
                      ? "Deterministic scoring engine"
                      : title === "AI Team Support"
                        ? "Operational copilots"
                        : "Early intervention signals"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="framer-panel rounded-[24px] p-6 md:p-8">
          <p className="framer-kicker">Core Principles</p>
          <div className="mt-6 space-y-4">
            {principles.map((item) => (
              <div
                key={item.label}
                className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"
              >
                <p className="text-sm font-medium text-white">
                  <span className="mr-2 text-[#0099ff]">+</span>
                  {item.label}
                </p>
                <p className="mt-1 pl-4 text-sm leading-6 text-white/58">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="framer-panel rounded-[24px] p-6 md:p-8">
          <p className="framer-kicker">How it works</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {workflowSteps.map(({ step, title, desc }) => (
              <div
                key={step}
                className="rounded-[20px] border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="[font-family:var(--font-display)] text-5xl font-medium tracking-[-0.08em] text-white/14">
                  {step}
                </p>
                <p className="mt-5 text-lg font-semibold tracking-[-0.03em] text-white">
                  {title}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/58">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
