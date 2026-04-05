import type { StudentIntake } from "@/types/domain";

export const seedStudents: StudentIntake[] = [
  {
    id: "stu-01",
    name: "Avery Chen",
    email: "avery.chen@example.edu",
    timezone: "America/Los_Angeles",
    availability: [
      { day: "Mon", start: "16:00", end: "18:00" },
      { day: "Wed", start: "17:00", end: "19:00" }
    ],
    strengths: ["frontend", "ux-research", "storytelling"],
    growthAreas: ["backend", "testing"],
    preferredRole: "Product lead",
    communicationStyle: "facilitative",
    collaborationPreferences: ["shared docs", "weekly retro"],
    shortReflection:
      "I like helping teams align early and keeping momentum with visible milestones."
  },
  {
    id: "stu-02",
    name: "Noah Ramirez",
    email: "noah.ramirez@example.edu",
    timezone: "America/Denver",
    availability: [
      { day: "Tue", start: "18:00", end: "20:00" },
      { day: "Thu", start: "18:00", end: "20:00" }
    ],
    strengths: ["python", "data-analysis", "automation"],
    growthAreas: ["public-speaking", "design"],
    preferredRole: "Technical builder",
    communicationStyle: "analytical",
    collaborationPreferences: ["clear task board", "written updates"],
    shortReflection:
      "I contribute best with clear requirements and can quickly prototype data-driven features."
  },
  {
    id: "stu-03",
    name: "Mina Patel",
    email: "mina.patel@example.edu",
    timezone: "America/Phoenix",
    availability: [
      { day: "Mon", start: "19:00", end: "21:00" },
      { day: "Fri", start: "15:00", end: "17:00" }
    ],
    strengths: ["presentation", "research", "planning"],
    growthAreas: ["coding", "api-design"],
    preferredRole: "Coordinator",
    communicationStyle: "collaborative",
    collaborationPreferences: ["video check-ins", "shared agenda"],
    shortReflection:
      "I enjoy synthesizing ideas and making sure everyone understands project goals."
  },
  {
    id: "stu-04",
    name: "Ethan Brooks",
    email: "ethan.brooks@example.edu",
    timezone: "America/Chicago",
    availability: [
      { day: "Tue", start: "17:00", end: "19:00" },
      { day: "Sat", start: "10:00", end: "12:00" }
    ],
    strengths: ["backend", "node", "system-design"],
    growthAreas: ["ux-research", "facilitation"],
    preferredRole: "Backend engineer",
    communicationStyle: "direct",
    collaborationPreferences: ["async-first", "issue templates"],
    shortReflection:
      "I can architect APIs quickly and like collaborating through structured async updates."
  },
  {
    id: "stu-05",
    name: "Sofia Nguyen",
    email: "sofia.nguyen@example.edu",
    timezone: "America/New_York",
    availability: [
      { day: "Wed", start: "18:00", end: "20:00" },
      { day: "Sun", start: "11:00", end: "13:00" }
    ],
    strengths: ["ui-design", "visual-branding", "prototyping"],
    growthAreas: ["database", "analytics"],
    preferredRole: "Design lead",
    communicationStyle: "reflective",
    collaborationPreferences: ["design critiques", "moodboards"],
    shortReflection:
      "I want to build cleaner interfaces while learning more about implementation tradeoffs."
  },
  {
    id: "stu-06",
    name: "Liam Okafor",
    email: "liam.okafor@example.edu",
    timezone: "America/Los_Angeles",
    availability: [
      { day: "Thu", start: "16:00", end: "18:00" },
      { day: "Fri", start: "16:00", end: "18:00" }
    ],
    strengths: ["testing", "qa", "documentation"],
    growthAreas: ["leadership", "frontend"],
    preferredRole: "Quality owner",
    communicationStyle: "analytical",
    collaborationPreferences: ["checklists", "rubrics"],
    shortReflection:
      "I like improving reliability and making expectations explicit for everyone in the team."
  },
  {
    id: "stu-07",
    name: "Isabella Torres",
    email: "isabella.torres@example.edu",
    timezone: "America/Denver",
    availability: [
      { day: "Mon", start: "15:00", end: "17:00" },
      { day: "Thu", start: "19:00", end: "21:00" }
    ],
    strengths: ["user-interviews", "writing", "facilitation"],
    growthAreas: ["backend", "data-visualization"],
    preferredRole: "User advocate",
    communicationStyle: "facilitative",
    collaborationPreferences: ["peer feedback", "co-editing"],
    shortReflection:
      "I am strongest at gathering user insights and translating them into practical decisions."
  },
  {
    id: "stu-08",
    name: "Mateo Silva",
    email: "mateo.silva@example.edu",
    timezone: "America/Phoenix",
    availability: [
      { day: "Tue", start: "16:00", end: "18:00" },
      { day: "Fri", start: "18:00", end: "20:00" }
    ],
    strengths: ["ml-basics", "python", "experimentation"],
    growthAreas: ["communication", "project-planning"],
    preferredRole: "AI integrator",
    communicationStyle: "direct",
    collaborationPreferences: ["short standups", "experiment logs"],
    shortReflection:
      "I enjoy trying fast model experiments and want to improve how I communicate tradeoffs."
  },
  {
    id: "stu-09",
    name: "Grace Kim",
    email: "grace.kim@example.edu",
    timezone: "America/Chicago",
    availability: [
      { day: "Wed", start: "16:00", end: "18:00" },
      { day: "Sat", start: "13:00", end: "15:00" }
    ],
    strengths: ["project-management", "stakeholder-comms", "ops"],
    growthAreas: ["coding", "ui-design"],
    preferredRole: "Operations lead",
    communicationStyle: "collaborative",
    collaborationPreferences: ["weekly planning", "decision logs"],
    shortReflection:
      "I keep teams on timeline and help clarify ownership when project scope shifts."
  },
  {
    id: "stu-10",
    name: "Arjun Desai",
    email: "arjun.desai@example.edu",
    timezone: "America/New_York",
    availability: [
      { day: "Mon", start: "18:00", end: "20:00" },
      { day: "Thu", start: "17:00", end: "19:00" }
    ],
    strengths: ["typescript", "frontend", "performance"],
    growthAreas: ["mentoring", "research"],
    preferredRole: "Frontend engineer",
    communicationStyle: "direct",
    collaborationPreferences: ["pair programming", "clear acceptance criteria"],
    shortReflection:
      "I like building fast interfaces and want to get better at mentoring teammates."
  },
  {
    id: "stu-11",
    name: "Hannah Lee",
    email: "hannah.lee@example.edu",
    timezone: "America/Los_Angeles",
    availability: [
      { day: "Tue", start: "15:00", end: "17:00" },
      { day: "Sun", start: "14:00", end: "16:00" }
    ],
    strengths: ["content-strategy", "documentation", "editing"],
    growthAreas: ["technical-depth", "data-analysis"],
    preferredRole: "Communications coordinator",
    communicationStyle: "reflective",
    collaborationPreferences: ["meeting summaries", "shared notes"],
    shortReflection:
      "I help teams communicate clearly and can keep project outputs coherent and polished."
  },
  {
    id: "stu-12",
    name: "Jordan Miller",
    email: "jordan.miller@example.edu",
    timezone: "America/Denver",
    availability: [
      { day: "Wed", start: "17:00", end: "19:00" },
      { day: "Fri", start: "17:00", end: "19:00" }
    ],
    strengths: ["api-design", "debugging", "integration"],
    growthAreas: ["presentation", "facilitation"],
    preferredRole: "Full-stack contributor",
    communicationStyle: "analytical",
    collaborationPreferences: ["structured handoffs", "pr reviews"],
    shortReflection:
      "I like connecting systems end-to-end and improving reliability through careful debugging."
  }
];
