import { seedStudents } from "@/data/seedStudents";
import type {
  AvailabilitySlot,
  CommunicationStyle,
  StudentIntake
} from "@/types/domain";

const variantNames = [
  "Zoe Martinez",
  "Caleb Park",
  "Nia Johnson",
  "Julian Rivera",
  "Priya Shah",
  "Diego Alvarez",
  "Emily Zhao",
  "Marcus Reed",
  "Leila Hassan",
  "Owen Murphy",
  "Anika Bose",
  "Daniel Kim",
  "Jasmine Carter",
  "Nathan Flores",
  "Riya Banerjee",
  "Cameron Price",
  "Elena Petrova",
  "Micah Turner",
  "Audrey Lin",
  "Victor Chen",
  "Samira Ali",
  "Evan Thompson",
  "Naomi Brooks",
  "Leo Gutierrez",
  "Tessa Nguyen",
  "Miles Robinson",
  "Fatima Ahmed",
  "Isaac Bennett",
  "Maya Singh",
  "Christopher Young",
  "Bianca Lopez",
  "Adrian Morris",
  "Clara Wilson",
  "Rafael Costa",
  "Neha Kapoor",
  "Trevor Scott",
  "Phoebe Adams",
  "Gabriel Lewis",
  "Aisha Bello",
  "Dominic Wright",
  "Serena Choi",
  "Xavier Ortiz",
  "Lina Haddad",
  "Cole Foster",
  "Amara James",
  "Ryan Patel",
  "Sabrina Cruz",
  "Benjamin Ross"
] as const;

const communicationStyleCycle: CommunicationStyle[] = [
  "collaborative",
  "analytical",
  "reflective",
  "facilitative"
];

const canonicalAvailabilityPatterns: AvailabilitySlot[][] = [
  [
    { day: "Mon", start: "17:00", end: "19:00" },
    { day: "Wed", start: "17:00", end: "19:00" }
  ],
  [
    { day: "Mon", start: "18:00", end: "20:00" },
    { day: "Thu", start: "18:00", end: "20:00" }
  ],
  [
    { day: "Tue", start: "16:00", end: "18:00" },
    { day: "Thu", start: "16:00", end: "18:00" }
  ],
  [
    { day: "Tue", start: "18:00", end: "20:00" },
    { day: "Thu", start: "18:00", end: "20:00" }
  ],
  [
    { day: "Wed", start: "16:00", end: "18:00" },
    { day: "Fri", start: "16:00", end: "18:00" }
  ],
  [
    { day: "Wed", start: "17:00", end: "19:00" },
    { day: "Fri", start: "17:00", end: "19:00" }
  ],
  [
    { day: "Mon", start: "19:00", end: "21:00" },
    { day: "Thu", start: "19:00", end: "21:00" }
  ],
  [
    { day: "Sat", start: "10:00", end: "12:00" },
    { day: "Sun", start: "11:00", end: "13:00" }
  ]
];

const availabilityPatternFamilies = [
  [0, 1, 0, 2],
  [3, 4, 3, 5],
  [2, 5, 2, 6],
  [1, 3, 1, 4],
  [0, 4, 0, 7],
  [2, 3, 2, 5]
] as const;

const roleVariantsByBaseId: Record<string, string[]> = {
  "stu-01": ["Product lead", "UX strategist", "Sprint planner", "Product storyteller"],
  "stu-02": [
    "Technical builder",
    "Data workflow builder",
    "Automation partner",
    "Analytics contributor"
  ],
  "stu-03": [
    "Coordinator",
    "Research coordinator",
    "Planning facilitator",
    "Presentation lead"
  ],
  "stu-04": [
    "Backend engineer",
    "API architect",
    "Platform contributor",
    "Infrastructure lead"
  ],
  "stu-05": ["Design lead", "UI designer", "Prototype owner", "Visual systems lead"],
  "stu-06": ["Quality owner", "QA coordinator", "Documentation lead", "Testing specialist"],
  "stu-07": [
    "User advocate",
    "Research lead",
    "Interview facilitator",
    "Insights translator"
  ],
  "stu-08": ["AI integrator", "Experiment lead", "ML prototyper", "Model evaluator"],
  "stu-09": [
    "Operations lead",
    "Project coordinator",
    "Delivery manager",
    "Stakeholder liaison"
  ],
  "stu-10": [
    "Frontend engineer",
    "Performance-focused builder",
    "UI implementation lead",
    "Client-side developer"
  ],
  "stu-11": [
    "Communications coordinator",
    "Content strategist",
    "Documentation editor",
    "Narrative owner"
  ],
  "stu-12": [
    "Full-stack contributor",
    "Integration engineer",
    "Debugging specialist",
    "Systems connector"
  ]
};

const strengthVariantsByBaseId: Record<string, string[][]> = {
  "stu-01": [
    ["frontend", "ux-research", "roadmapping"],
    ["frontend", "storytelling", "stakeholder-alignment"],
    ["ux-research", "facilitation", "planning"],
    ["frontend", "prototyping", "storytelling"]
  ],
  "stu-02": [
    ["python", "automation", "sql"],
    ["data-analysis", "python", "dashboarding"],
    ["automation", "experimentation", "debugging"],
    ["python", "data-analysis", "workflow-design"]
  ],
  "stu-03": [
    ["presentation", "research", "note-synthesis"],
    ["planning", "research", "team-coordination"],
    ["presentation", "facilitation", "planning"],
    ["research", "writing", "storytelling"]
  ],
  "stu-04": [
    ["backend", "node", "database-design"],
    ["system-design", "backend", "api-design"],
    ["backend", "debugging", "integration"],
    ["node", "system-design", "reliability"]
  ],
  "stu-05": [
    ["ui-design", "visual-branding", "figma"],
    ["prototyping", "ui-design", "design-systems"],
    ["visual-branding", "storytelling", "wireframing"],
    ["ui-design", "prototyping", "accessibility"]
  ],
  "stu-06": [
    ["testing", "qa", "bug-triage"],
    ["documentation", "qa", "release-checklists"],
    ["testing", "documentation", "process-improvement"],
    ["qa", "rubric-design", "reliability"]
  ],
  "stu-07": [
    ["user-interviews", "writing", "survey-design"],
    ["facilitation", "user-interviews", "synthesis"],
    ["writing", "research", "insight-mapping"],
    ["facilitation", "storytelling", "user-advocacy"]
  ],
  "stu-08": [
    ["ml-basics", "python", "prompt-design"],
    ["experimentation", "python", "evaluation"],
    ["ml-basics", "data-analysis", "prototyping"],
    ["python", "experimentation", "model-comparison"]
  ],
  "stu-09": [
    ["project-management", "ops", "timeline-planning"],
    ["stakeholder-comms", "ops", "coordination"],
    ["project-management", "decision-making", "organization"],
    ["ops", "planning", "follow-through"]
  ],
  "stu-10": [
    ["typescript", "frontend", "component-design"],
    ["performance", "frontend", "react"],
    ["typescript", "debugging", "ui-implementation"],
    ["frontend", "accessibility", "performance"]
  ],
  "stu-11": [
    ["content-strategy", "documentation", "editing"],
    ["editing", "writing", "project-comms"],
    ["documentation", "organization", "meeting-recaps"],
    ["content-strategy", "storytelling", "clarity"]
  ],
  "stu-12": [
    ["api-design", "integration", "debugging"],
    ["integration", "system-thinking", "testing"],
    ["debugging", "backend", "api-design"],
    ["full-stack", "integration", "reliability"]
  ]
};

const growthVariantsByBaseId: Record<string, string[][]> = {
  "stu-01": [
    ["backend", "testing"],
    ["technical-scoping", "testing"],
    ["backend", "database-design"],
    ["testing", "api-design"]
  ],
  "stu-02": [
    ["public-speaking", "design"],
    ["team-facilitation", "visual-design"],
    ["presentation", "product-thinking"],
    ["design", "stakeholder-comms"]
  ],
  "stu-03": [
    ["coding", "api-design"],
    ["technical-depth", "backend"],
    ["frontend", "data-analysis"],
    ["coding", "prototyping"]
  ],
  "stu-04": [
    ["ux-research", "facilitation"],
    ["design-collaboration", "user-interviews"],
    ["facilitation", "presentation"],
    ["ux-research", "storytelling"]
  ],
  "stu-05": [
    ["database", "analytics"],
    ["frontend", "implementation-tradeoffs"],
    ["analytics", "testing"],
    ["database", "engineering-collaboration"]
  ],
  "stu-06": [
    ["leadership", "frontend"],
    ["product-thinking", "frontend"],
    ["leadership", "facilitation"],
    ["ui-design", "presentation"]
  ],
  "stu-07": [
    ["backend", "data-visualization"],
    ["technical-depth", "analytics"],
    ["backend", "experimentation"],
    ["data-visualization", "prototyping"]
  ],
  "stu-08": [
    ["communication", "project-planning"],
    ["presentation", "team-coordination"],
    ["documentation", "stakeholder-comms"],
    ["project-planning", "facilitation"]
  ],
  "stu-09": [
    ["coding", "ui-design"],
    ["technical-depth", "frontend"],
    ["data-analysis", "prototyping"],
    ["coding", "design-collaboration"]
  ],
  "stu-10": [
    ["mentoring", "research"],
    ["facilitation", "user-research"],
    ["public-speaking", "planning"],
    ["mentoring", "stakeholder-comms"]
  ],
  "stu-11": [
    ["technical-depth", "data-analysis"],
    ["frontend", "analytics"],
    ["api-literacy", "technical-confidence"],
    ["data-analysis", "experimentation"]
  ],
  "stu-12": [
    ["presentation", "facilitation"],
    ["design-collaboration", "public-speaking"],
    ["stakeholder-comms", "mentoring"],
    ["facilitation", "research"]
  ]
};

const reflectionTemplatesByBaseId: Record<string, string[]> = {
  "stu-01": [
    "I like turning broad ideas into a plan the team can actually execute and revisit each week.",
    "I usually help teams get unstuck by clarifying priorities and keeping user needs visible.",
    "I enjoy connecting product decisions to what users are telling us in interviews or demos.",
    "I want to keep sharpening how I scope features while still supporting a strong team rhythm."
  ],
  "stu-02": [
    "I am comfortable building the first technical version quickly when the requirements are clear.",
    "I like working through data problems methodically and documenting what the numbers actually mean.",
    "I usually contribute by automating repetitive work so the rest of the team can move faster.",
    "I want to keep improving how I explain technical tradeoffs to teammates outside engineering."
  ],
  "stu-03": [
    "I am usually the person organizing notes, next steps, and presentation flow for the team.",
    "I like helping everyone leave a meeting with the same understanding of goals and ownership.",
    "I enjoy combining research into a story that feels clear, practical, and easy to present.",
    "I want to grow my technical confidence while keeping the team organized and aligned."
  ],
  "stu-04": [
    "I like building the underlying structure of a project so the rest of the team can move cleanly.",
    "I usually contribute by translating big ideas into APIs, data models, and concrete implementation steps.",
    "I prefer structured collaboration and enjoy making systems easier to integrate across the stack.",
    "I want to stay strong on architecture while getting better at collaborating with design-minded teammates."
  ],
  "stu-05": [
    "I enjoy shaping the visual direction early and then refining details once the workflow is clear.",
    "I like making interfaces feel polished without losing sight of what users need to accomplish.",
    "I usually contribute best when I can prototype quickly and get feedback into the next draft.",
    "I want to understand implementation constraints better so my design decisions are easier to build."
  ],
  "stu-06": [
    "I like being the person who catches edge cases before a demo turns into a scramble.",
    "I usually contribute by turning vague expectations into checklists, criteria, and repeatable review steps.",
    "I enjoy making team processes more reliable so the work feels less chaotic near deadlines.",
    "I want to keep building confidence in leading conversations, not just evaluating finished work."
  ],
  "stu-07": [
    "I like gathering user feedback and turning it into changes the team can act on right away.",
    "I usually help teams slow down just enough to confirm we are solving the right problem.",
    "I enjoy facilitating conversations where different teammates can weigh in without losing momentum.",
    "I want to pair strong user insight work with stronger technical instincts during the build phase."
  ],
  "stu-08": [
    "I enjoy trying lightweight AI experiments and comparing what actually works in practice.",
    "I like building quick proofs of concept and then iterating once we understand the constraints.",
    "I usually contribute by testing multiple approaches before the team commits to one implementation path.",
    "I want to get better at explaining experimental results clearly so others can make decisions faster."
  ],
  "stu-09": [
    "I like keeping the team organized when deadlines shift and priorities start competing with each other.",
    "I usually help by making ownership explicit and checking that follow-through actually happens.",
    "I enjoy the operational side of projects because it keeps good ideas from getting lost in the rush.",
    "I want to build more technical fluency while staying the person who keeps delivery on track."
  ],
  "stu-10": [
    "I like building responsive interfaces and tightening details that make the product feel more reliable.",
    "I usually contribute best when I can turn requirements into a clean UI quickly and iterate from feedback.",
    "I enjoy solving performance and usability issues that help the final project feel more polished.",
    "I want to keep growing as a teammate who not only ships code but also supports others effectively."
  ],
  "stu-11": [
    "I like turning scattered ideas into writing that feels clear, polished, and consistent across the project.",
    "I usually contribute by making sure updates, docs, and summaries are understandable for everyone involved.",
    "I enjoy helping teams sound more coherent in demos, deliverables, and internal planning notes.",
    "I want to strengthen my technical depth so I can bridge communication and implementation more confidently."
  ],
  "stu-12": [
    "I like connecting different pieces of a project and fixing the issues that show up between them.",
    "I usually contribute by tracing problems carefully and making integrations feel less fragile.",
    "I enjoy end-to-end work because it helps me see how technical decisions affect the whole team.",
    "I want to pair my debugging strengths with stronger facilitation when the team is coordinating across roles."
  ]
};

function createEmail(name: string) {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.+|\.+$/g, "")}@example.edu`;
}

function cloneAvailabilityPattern(patternIndex: number) {
  return canonicalAvailabilityPatterns[patternIndex].map((slot) => ({ ...slot }));
}

function normalizeGrowthArea(area: string) {
  const normalized = area.trim().toLowerCase();
  const aliasMap: Record<string, string> = {
    coding: "backend",
    design: "ui-design",
    database: "database-design",
    analytics: "data-analysis",
    data_visualization: "data-analysis",
    "data-visualization": "data-analysis",
    technical_depth: "backend",
    "technical-depth": "backend",
    api_literacy: "api-design",
    "api-literacy": "api-design",
    public_speaking: "presentation",
    "public-speaking": "presentation",
    team_facilitation: "facilitation",
    "team-facilitation": "facilitation",
    project_planning: "planning",
    "project-planning": "planning",
    product_thinking: "planning",
    "product-thinking": "planning",
    technical_scoping: "planning",
    "technical-scoping": "planning",
    communication: "writing",
    mentoring: "facilitation",
    ui_design: "ui-design",
    implementation_tradeoffs: "system-design",
    "implementation-tradeoffs": "system-design",
    design_collaboration: "ui-design",
    "design-collaboration": "ui-design",
    technical_confidence: "debugging",
    "technical-confidence": "debugging"
  };

  return aliasMap[normalized] ?? area;
}

function buildGrowthAreas(baseStudentId: string, variantIndex: number) {
  return [...new Set(growthVariantsByBaseId[baseStudentId][variantIndex].map(normalizeGrowthArea))];
}

function createVariantStudent(baseStudent: StudentIntake, baseIndex: number, variantIndex: number) {
  const globalVariantIndex = baseIndex * 4 + variantIndex;
  const name = variantNames[globalVariantIndex];
  const availabilityFamily = availabilityPatternFamilies[baseIndex % availabilityPatternFamilies.length];
  const availability = cloneAvailabilityPattern(availabilityFamily[variantIndex]);

  return {
    ...baseStudent,
    id: `stu-${String(seedStudents.length + globalVariantIndex + 1).padStart(2, "0")}`,
    name,
    email: createEmail(name),
    availability,
    strengths: strengthVariantsByBaseId[baseStudent.id][variantIndex],
    growthAreas: buildGrowthAreas(baseStudent.id, variantIndex),
    preferredRole: roleVariantsByBaseId[baseStudent.id][variantIndex],
    communicationStyle:
      variantIndex % 2 === 0
        ? baseStudent.communicationStyle
        : communicationStyleCycle[(baseIndex + variantIndex) % communicationStyleCycle.length],
    shortReflection: reflectionTemplatesByBaseId[baseStudent.id][variantIndex]
  } satisfies StudentIntake;
}

export function generateExpandedStudents(): StudentIntake[] {
  const variants = seedStudents.flatMap((student, baseIndex) =>
    Array.from({ length: 4 }, (_, variantIndex) =>
      createVariantStudent(student, baseIndex, variantIndex)
    )
  );

  return [...seedStudents, ...variants];
}

export const expandedStudents = generateExpandedStudents();
