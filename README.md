# Collabor-AI-tor

Collabor-AI-tor is a hackathon MVP for project-based courses. It helps instructors collect student collaboration data, generate structured student profiles, form balanced teams with transparent rationale, and support teams with lightweight AI tools.

## What The App Does

- Collects student intake data (strengths, growth areas, availability, communication style, role preferences)
- Generates structured student profiles (mock-first with Gemini-ready route stubs)
- Forms balanced teams with deterministic heuristic scoring
- Explains why each team was formed, including risk flags and score breakdowns
- Provides team support tools:
  - Team charter generator
  - Meeting notes to action items summarizer
  - Professional message rewrite assistant

## Stack

- Next.js 14+ (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn-style reusable UI primitives
- Zod validation schemas
- Firebase Auth stubs (Google Sign-In ready)
- Mock-first data layer with seedable JSON state
- Gemini/Vertex API route placeholders with deterministic mock fallback

## Folder Structure

```txt
app/
  api/
    ai/
      profile/
      generate-teams-rationale/
      charter/
      summarize-meeting/
      rewrite-message/
    demo/
      seed/
      generate-profiles/
      generate-teams/
    student/
      intake/
  instructor/
  student/
    intake/
    profile-review/
  teams/
    [teamId]/
  tools/
  page.tsx
components/
  instructor/
  layout/
  student/
  teams/
  tools/
  ui/
lib/
  ai/
  repo/
  teamFormation.ts
  schemas.ts
  firebase.ts
types/
data/
scripts/
docs/
```

## Local Run

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. (Optional) Reset or seed demo state:

```bash
pnpm seed:reset
pnpm seed
```

4. Start development server:

```bash
pnpm dev
```

5. Open `http://localhost:3000`

## Environment Variables

Set variables in `.env.local`.

### Mock/Auth/Data

- `NEXT_PUBLIC_USE_MOCK_AUTH=true` keeps UI in mock sign-in mode
- `USE_MOCK_DATA=true` keeps demo data in mock repository mode

### Firebase (optional)

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Gemini / Vertex (optional)

- `GEMINI_API_KEY`
- `VERTEX_PROJECT_ID`
- `VERTEX_LOCATION`
- `VERTEX_MODEL`

If Gemini/Vertex credentials are missing, all AI routes return realistic mock responses so demo flow remains fully operational.

### Google OAuth + Calendar (optional)

Required only if you want real Google Calendar invites + Meet links from Team Copilot.

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI` (e.g. `http://localhost:3000/api/google/connect/callback`)
- `GOOGLE_TOKEN_ENCRYPTION_KEY` (used server-side to encrypt stored tokens)

## Mock Mode Behavior

- On first run, demo state is initialized from seeded students
- `Load Demo Seed` refreshes state with 12 mock students + generated profiles + 3 teams of 4
- AI routes in `app/api/ai/*` always validate requests/responses with Zod
- Gemini integration points are marked with TODO comments, while mock fallbacks keep output deterministic

## Demo Flow

1. Landing page (`/`) to explain product value
2. Instructor dashboard (`/instructor`) and click `Load Demo Seed`
3. Click `Generate Profiles`
4. Go to Profile Review (`/student/profile-review`)
5. Go to Team Generation (`/teams`) and click `Generate Teams`
6. Open a team detail page for charter, rotation, checklist, and AI widgets
7. Visit AI Tools page (`/tools`) for standalone support utilities

## Scripts

- `pnpm dev` - run dev server
- `pnpm build` - production build
- `pnpm start` - run production server
- `pnpm lint` - run lint checks
- `pnpm typecheck` - strict TypeScript checks
- `pnpm format` - run Prettier
- `pnpm seed` - generate demo state from seed data
- `pnpm seed:reset` - reset demo state
