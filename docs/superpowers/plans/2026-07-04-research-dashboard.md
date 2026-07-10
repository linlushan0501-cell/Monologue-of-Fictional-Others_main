# Research Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub- and Vercel-ready Next.js first version of the researcher dashboard with local mock generation and review workflow.

**Architecture:** Create a client-side Next.js App Router dashboard. Keep domain types, localStorage persistence, and mock generation in `lib/`, and keep UI pieces in focused `components/` files. The first version has no real API calls, but names the generation boundary so a future `/api/generate` route can replace the mock.

**Tech Stack:** Next.js, React, TypeScript, CSS modules/global CSS, localStorage, npm scripts runnable by Vercel.

---

## File Structure

- `package.json`: project scripts and dependencies.
- `next.config.ts`: default Next.js config.
- `tsconfig.json`: strict TypeScript config for Next.js.
- `eslint.config.mjs`: Next lint configuration.
- `.gitignore`: ignore dependencies, builds, local env, and `.superpowers/`.
- `README.md`: local setup, GitHub upload, and Vercel deployment notes.
- `app/layout.tsx`: app metadata and global layout wrapper.
- `app/page.tsx`: client dashboard composition and state orchestration.
- `app/globals.css`: complete visual system and responsive layout.
- `lib/types.ts`: participant, character, generation, status, condition, and time-point types.
- `lib/defaultState.ts`: seed prototype state and default character slots.
- `lib/storage.ts`: safe localStorage load/save helpers.
- `lib/mockGeneration.ts`: prompt-shaped mock generation with a simulated delay.
- `components/Sidebar.tsx`: desktop left navigation and compact mobile navigation.
- `components/StepFlow.tsx`: top step pills for the active workflow step.
- `components/ParticipantForm.tsx`: participant, event, and time-point form.
- `components/CharacterForm.tsx`: 2 to 3 role editor.
- `components/GenerationConsole.tsx`: single-combination generation controls and result card.
- `components/ProgressMatrix.tsx`: read-only role x condition x time matrix.
- `components/ReviewPanel.tsx`: filtering, editing, approving, rejecting, and regenerating.

## Task 1: Scaffold The Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `.gitignore`
- Create: `README.md`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create the project metadata and scripts**

Create `package.json`:

```json
{
  "name": "research-monologue-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@next/eslint-plugin-next": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "typescript": "latest"
  }
}
```

- [ ] **Step 2: Add framework config**

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `eslint.config.mjs`:

```js
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")];

export default eslintConfig;
```

- [ ] **Step 3: Add ignore rules and setup docs**

Create `.gitignore`:

```gitignore
node_modules
.next
out
.vercel
.env
.env.local
.env*.local
.DS_Store
.superpowers
```

Create `README.md`:

```md
# Research Monologue Dashboard

First-version researcher dashboard for entering interview data, generating one mock monologue at a time, and reviewing generated content.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current Scope

- Front-end workflow only.
- Mock generation only.
- Data persists in browser `localStorage`.
- OpenAI and Notion integrations are reserved for the next phase.

## Vercel

Import this GitHub repository into Vercel. No environment variables are required for the first version.
```

- [ ] **Step 4: Add minimal app files**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Monologue Dashboard",
  description: "Researcher workflow for fictional other-role monologue generation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
export default function Home() {
  return <main className="app-shell">Research dashboard scaffold</main>;
}
```

Create `app/globals.css`:

```css
:root {
  --background: #f6f6f2;
  --surface: #ffffff;
  --surface-muted: #e9e9e3;
  --ink: #202020;
  --muted: #73736c;
  --line: #d9d9d1;
  --dark: #2d2d2b;
  --radius: 18px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--ink);
  font-family: Arial, Helvetica, sans-serif;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}
```

- [ ] **Step 5: Install dependencies and verify scaffold**

Run:

```bash
npm install
npm run build
```

Expected: dependencies install successfully and `npm run build` exits with code 0.

## Task 2: Add Domain Types, Defaults, Storage, And Mock Generation

**Files:**
- Create: `lib/types.ts`
- Create: `lib/defaultState.ts`
- Create: `lib/storage.ts`
- Create: `lib/mockGeneration.ts`

- [ ] **Step 1: Create shared types**

Create `lib/types.ts`:

```ts
export type Condition = "real" | "counterfactual";
export type TimePointType = "past" | "present" | "future";
export type ReviewStatus = "pending" | "approved" | "rejected" | "regenerated";
export type StepId = "participant" | "event" | "characters" | "generate" | "review";

export type Character = {
  id: string;
  name: string;
  relationship: string;
  selectionReason: string;
};

export type Participant = {
  id: string;
  code: string;
  interviewDate: string;
  realEventDescription: string;
  counterfactualDescription: string;
  pastTimePoint: string;
  futureTimePoint: string;
  characters: Character[];
};

export type Generation = {
  id: string;
  participantId: string;
  characterId: string;
  characterName: string;
  relationship: string;
  selectionReason: string;
  condition: Condition;
  timePointType: TimePointType;
  timePointValue: string;
  generatedContent: string;
  generationTimestamp: string;
  promptVersion: string;
  reviewStatus: ReviewStatus;
  reviewerNotes: string;
  approvedAt: string | null;
};

export type DashboardState = {
  participant: Participant;
  generations: Generation[];
};
```

- [ ] **Step 2: Add default state**

Create `lib/defaultState.ts`:

```ts
import type { DashboardState, Participant } from "./types";

export const createCharacter = (index: number) => ({
  id: `character-${index}`,
  name: "",
  relationship: "",
  selectionReason: "",
});

export const defaultParticipant: Participant = {
  id: "participant-local",
  code: "",
  interviewDate: "",
  realEventDescription: "",
  counterfactualDescription: "",
  pastTimePoint: "",
  futureTimePoint: "",
  characters: [createCharacter(1), createCharacter(2)],
};

export const defaultDashboardState: DashboardState = {
  participant: defaultParticipant,
  generations: [],
};
```

- [ ] **Step 3: Add storage helpers**

Create `lib/storage.ts`:

```ts
import { defaultDashboardState } from "./defaultState";
import type { DashboardState } from "./types";

const STORAGE_KEY = "research-monologue-dashboard-state";

export function loadDashboardState(): DashboardState {
  if (typeof window === "undefined") {
    return defaultDashboardState;
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as DashboardState) : defaultDashboardState;
  } catch {
    return defaultDashboardState;
  }
}

export function saveDashboardState(state: DashboardState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

- [ ] **Step 4: Add mock generation**

Create `lib/mockGeneration.ts`:

```ts
import type { Character, Condition, Generation, Participant, TimePointType } from "./types";

const PROMPT_VERSION = "prototype-v1";

const conditionLabel: Record<Condition, string> = {
  real: "真實事件",
  counterfactual: "What if 假設情境",
};

const timeLabel: Record<TimePointType, string> = {
  past: "過去",
  present: "現在",
  future: "未來",
};

export function getTimePointValue(participant: Participant, timePointType: TimePointType) {
  if (timePointType === "past") return participant.pastTimePoint;
  if (timePointType === "future") return participant.futureTimePoint;
  return "此時此刻";
}

export async function createMockGeneration(params: {
  participant: Participant;
  character: Character;
  condition: Condition;
  timePointType: TimePointType;
  reviewerNotes?: string;
}): Promise<Generation> {
  const { participant, character, condition, timePointType, reviewerNotes = "" } = params;
  const eventText =
    condition === "real" ? participant.realEventDescription : participant.counterfactualDescription;
  const timePointValue = getTimePointValue(participant, timePointType);

  await new Promise((resolve) => window.setTimeout(resolve, 900));

  const generatedContent = `【${character.name || "未命名角色"}】我站在${timeLabel[timePointType]}的${timePointValue}，以${character.relationship || "他者"}的位置看著這件事。${conditionLabel[condition]}裡最讓我放不下的，是「${eventText.slice(0, 72)}」。我只能依照我知道的部分說話，不替任何人補上沒有說出口的背景。被選進這段敘事，是因為${character.selectionReason || "我和參與者之間有需要被理解的關係"}。`;

  return {
    id: `${character.id}-${condition}-${timePointType}`,
    participantId: participant.id,
    characterId: character.id,
    characterName: character.name,
    relationship: character.relationship,
    selectionReason: character.selectionReason,
    condition,
    timePointType,
    timePointValue,
    generatedContent,
    generationTimestamp: new Date().toISOString(),
    promptVersion: PROMPT_VERSION,
    reviewStatus: reviewerNotes ? "regenerated" : "pending",
    reviewerNotes,
    approvedAt: null,
  };
}
```

- [ ] **Step 5: Run TypeScript check through build**

Run:

```bash
npm run build
```

Expected: build exits with code 0.

## Task 3: Build Dashboard State And Shell

**Files:**
- Modify: `app/page.tsx`
- Create: `components/Sidebar.tsx`
- Create: `components/StepFlow.tsx`

- [ ] **Step 1: Add navigation components**

Create `components/Sidebar.tsx`:

```tsx
import type { StepId } from "@/lib/types";

type NavItem = {
  id: StepId;
  label: string;
  eyebrow: string;
};

const navItems: NavItem[] = [
  { id: "participant", label: "參與者", eyebrow: "01" },
  { id: "event", label: "事件", eyebrow: "02" },
  { id: "characters", label: "角色", eyebrow: "03" },
  { id: "generate", label: "生成", eyebrow: "04" },
  { id: "review", label: "審閱", eyebrow: "05" },
];

export function Sidebar({
  activeStep,
  onStepChange,
}: {
  activeStep: StepId;
  onStepChange: (step: StepId) => void;
}) {
  return (
    <aside className="sidebar">
      <div>
        <p className="sidebar-kicker">Research Console</p>
        <h1>虛構他者獨白</h1>
      </div>
      <nav className="sidebar-nav" aria-label="Dashboard sections">
        {navItems.map((item) => (
          <button
            className={item.id === activeStep ? "nav-item active" : "nav-item"}
            key={item.id}
            onClick={() => onStepChange(item.id)}
            type="button"
          >
            <span>{item.eyebrow}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
```

Create `components/StepFlow.tsx`:

```tsx
import type { StepId } from "@/lib/types";

const steps: { id: StepId; label: string }[] = [
  { id: "participant", label: "參與者" },
  { id: "event", label: "事件" },
  { id: "characters", label: "角色" },
  { id: "generate", label: "生成" },
  { id: "review", label: "審閱" },
];

export function StepFlow({
  activeStep,
  onStepChange,
}: {
  activeStep: StepId;
  onStepChange: (step: StepId) => void;
}) {
  return (
    <div className="step-flow" aria-label="Workflow steps">
      {steps.map((step) => (
        <button
          className={step.id === activeStep ? "step-pill active" : "step-pill"}
          key={step.id}
          onClick={() => onStepChange(step.id)}
          type="button"
        >
          {step.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Compose the shell**

Replace `app/page.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { StepFlow } from "@/components/StepFlow";
import { defaultDashboardState } from "@/lib/defaultState";
import { loadDashboardState, saveDashboardState } from "@/lib/storage";
import type { DashboardState, StepId } from "@/lib/types";

export default function Home() {
  const [activeStep, setActiveStep] = useState<StepId>("participant");
  const [state, setState] = useState<DashboardState>(defaultDashboardState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(loadDashboardState());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveDashboardState(state);
    }
  }, [isLoaded, state]);

  const pageTitle = useMemo(() => {
    const labels: Record<StepId, string> = {
      participant: "參與者資料",
      event: "事件與時間點",
      characters: "他者角色",
      generate: "單筆生成",
      review: "審閱內容",
    };
    return labels[activeStep];
  }, [activeStep]);

  return (
    <main className="dashboard-shell">
      <Sidebar activeStep={activeStep} onStepChange={setActiveStep} />
      <section className="workspace">
        <StepFlow activeStep={activeStep} onStepChange={setActiveStep} />
        <div className="workspace-heading">
          <p>Prototype v1</p>
          <h2>{pageTitle}</h2>
        </div>
        <div className="panel">
          <pre>{JSON.stringify(state.participant, null, 2)}</pre>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Add shell styles**

Append to `app/globals.css`:

```css
.dashboard-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 100vh;
  padding: 18px;
  gap: 18px;
}

.sidebar {
  background: var(--dark);
  color: #ffffff;
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: calc(100vh - 36px);
}

.sidebar-kicker,
.workspace-heading p {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 13px;
}

.sidebar h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.08;
}

.sidebar-nav {
  display: grid;
  gap: 10px;
}

.nav-item,
.step-pill,
.primary-button,
.secondary-button {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #ffffff;
  color: var(--ink);
  cursor: pointer;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.18);
  text-align: left;
}

.nav-item.active {
  background: #ffffff;
  color: var(--ink);
}

.nav-item span {
  color: var(--muted);
}

.workspace {
  min-width: 0;
  padding: 10px 6px 32px;
}

.step-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 28px;
}

.step-pill {
  padding: 10px 18px;
}

.step-pill.active {
  background: var(--dark);
  color: #ffffff;
  border-color: var(--dark);
}

.workspace-heading h2 {
  margin: 0 0 18px;
  font-size: 42px;
  line-height: 1;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 22px;
}

@media (max-width: 860px) {
  .dashboard-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    min-height: auto;
    gap: 22px;
  }
}
```

- [ ] **Step 4: Verify shell**

Run:

```bash
npm run build
```

Expected: build exits with code 0 and no TypeScript errors.

## Task 4: Add Forms, Generation Console, Matrix, And Review

**Files:**
- Modify: `app/page.tsx`
- Create: `components/ParticipantForm.tsx`
- Create: `components/CharacterForm.tsx`
- Create: `components/GenerationConsole.tsx`
- Create: `components/ProgressMatrix.tsx`
- Create: `components/ReviewPanel.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add participant/event form component**

Create `components/ParticipantForm.tsx`:

```tsx
import type { Participant } from "@/lib/types";

export function ParticipantForm({
  participant,
  mode,
  onChange,
}: {
  participant: Participant;
  mode: "participant" | "event";
  onChange: (participant: Participant) => void;
}) {
  const update = (field: keyof Participant, value: string) => {
    onChange({ ...participant, [field]: value });
  };

  if (mode === "participant") {
    return (
      <div className="form-grid">
        <label>
          <span>參與者代號</span>
          <input value={participant.code} onChange={(event) => update("code", event.target.value)} />
        </label>
        <label>
          <span>訪談日期</span>
          <input
            type="date"
            value={participant.interviewDate}
            onChange={(event) => update("interviewDate", event.target.value)}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="form-grid two-column">
      <label>
        <span>真實事件描述</span>
        <textarea
          value={participant.realEventDescription}
          onChange={(event) => update("realEventDescription", event.target.value)}
        />
      </label>
      <label>
        <span>What if 假設情境描述</span>
        <textarea
          value={participant.counterfactualDescription}
          onChange={(event) => update("counterfactualDescription", event.target.value)}
        />
      </label>
      <label>
        <span>過去時間點</span>
        <input
          value={participant.pastTimePoint}
          onChange={(event) => update("pastTimePoint", event.target.value)}
          placeholder="例如：小學三年級"
        />
      </label>
      <label>
        <span>未來時間點</span>
        <input
          value={participant.futureTimePoint}
          onChange={(event) => update("futureTimePoint", event.target.value)}
          placeholder="例如：20 年後"
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Add character form component**

Create `components/CharacterForm.tsx`:

```tsx
import { createCharacter } from "@/lib/defaultState";
import type { Character } from "@/lib/types";

export function CharacterForm({
  characters,
  onChange,
}: {
  characters: Character[];
  onChange: (characters: Character[]) => void;
}) {
  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    onChange(characters.map((character) => (character.id === id ? { ...character, [field]: value } : character)));
  };

  return (
    <div className="stack">
      {characters.map((character, index) => (
        <div className="character-card" key={character.id}>
          <div className="card-title">角色 {index + 1}</div>
          <div className="form-grid three-column">
            <label>
              <span>名稱</span>
              <input value={character.name} onChange={(event) => updateCharacter(character.id, "name", event.target.value)} />
            </label>
            <label>
              <span>關係</span>
              <input
                value={character.relationship}
                onChange={(event) => updateCharacter(character.id, "relationship", event.target.value)}
              />
            </label>
            <label>
              <span>選角理由</span>
              <input
                value={character.selectionReason}
                onChange={(event) => updateCharacter(character.id, "selectionReason", event.target.value)}
              />
            </label>
          </div>
        </div>
      ))}
      <button
        className="secondary-button"
        disabled={characters.length >= 3}
        onClick={() => onChange([...characters, createCharacter(characters.length + 1)])}
        type="button"
      >
        新增第三位角色
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Add generation console and matrix**

Create `components/ProgressMatrix.tsx`:

```tsx
import type { Character, Condition, Generation, TimePointType } from "@/lib/types";

const conditions: Condition[] = ["real", "counterfactual"];
const timePoints: TimePointType[] = ["past", "present", "future"];

const conditionLabels: Record<Condition, string> = {
  real: "真實",
  counterfactual: "反事實",
};

const timeLabels: Record<TimePointType, string> = {
  past: "過去",
  present: "現在",
  future: "未來",
};

export function ProgressMatrix({ characters, generations }: { characters: Character[]; generations: Generation[] }) {
  return (
    <div className="matrix">
      {characters.map((character) => (
        <div className="matrix-row" key={character.id}>
          <div className="matrix-name">{character.name || "未命名角色"}</div>
          {conditions.flatMap((condition) =>
            timePoints.map((timePoint) => {
              const generation = generations.find(
                (item) => item.characterId === character.id && item.condition === condition && item.timePointType === timePoint,
              );
              return (
                <div className={`matrix-cell ${generation?.reviewStatus ?? "missing"}`} key={`${condition}-${timePoint}`}>
                  <span>{conditionLabels[condition]}</span>
                  <strong>{timeLabels[timePoint]}</strong>
                </div>
              );
            }),
          )}
        </div>
      ))}
    </div>
  );
}
```

Create `components/GenerationConsole.tsx`:

```tsx
import { useMemo, useState } from "react";
import { createMockGeneration } from "@/lib/mockGeneration";
import type { Condition, Generation, Participant, TimePointType } from "@/lib/types";
import { ProgressMatrix } from "./ProgressMatrix";

export function GenerationConsole({
  participant,
  generations,
  onGenerated,
}: {
  participant: Participant;
  generations: Generation[];
  onGenerated: (generation: Generation) => void;
}) {
  const [characterId, setCharacterId] = useState(participant.characters[0]?.id ?? "");
  const [condition, setCondition] = useState<Condition>("real");
  const [timePointType, setTimePointType] = useState<TimePointType>("present");
  const [isGenerating, setIsGenerating] = useState(false);

  const character = useMemo(
    () => participant.characters.find((item) => item.id === characterId) ?? participant.characters[0],
    [characterId, participant.characters],
  );

  const canGenerate =
    Boolean(character?.name && character.relationship) &&
    Boolean(participant.realEventDescription) &&
    Boolean(participant.counterfactualDescription) &&
    Boolean(participant.pastTimePoint) &&
    Boolean(participant.futureTimePoint);

  const currentGeneration = generations.find(
    (item) => item.characterId === character?.id && item.condition === condition && item.timePointType === timePointType,
  );

  const generate = async () => {
    if (!character || !canGenerate) return;
    setIsGenerating(true);
    const generation = await createMockGeneration({ participant, character, condition, timePointType });
    onGenerated(generation);
    setIsGenerating(false);
  };

  return (
    <div className="console-grid">
      <section className="panel">
        <div className="control-row">
          <label>
            <span>選擇他者</span>
            <select value={characterId} onChange={(event) => setCharacterId(event.target.value)}>
              {participant.characters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || "未命名角色"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="segmented">
          {(["real", "counterfactual"] as Condition[]).map((item) => (
            <button className={condition === item ? "active" : ""} key={item} onClick={() => setCondition(item)} type="button">
              {item === "real" ? "真實" : "反事實"}
            </button>
          ))}
        </div>
        <div className="segmented">
          {(["past", "present", "future"] as TimePointType[]).map((item) => (
            <button
              className={timePointType === item ? "active" : ""}
              key={item}
              onClick={() => setTimePointType(item)}
              type="button"
            >
              {item === "past" ? "過去" : item === "present" ? "現在" : "未來"}
            </button>
          ))}
        </div>
        {!canGenerate ? <p className="hint">請先完成事件、時間點，並至少填好角色名稱與關係。</p> : null}
        <button className="primary-button" disabled={!canGenerate || isGenerating} onClick={generate} type="button">
          {isGenerating ? "生成中..." : "生成這一筆"}
        </button>
      </section>

      <section className="postcard">
        <p>{currentGeneration ? currentGeneration.reviewStatus : "尚未生成"}</p>
        <h3>{currentGeneration?.characterName || "等待選擇"}</h3>
        <div>{currentGeneration?.generatedContent || "選定角色、條件與時間點後，按下生成。結果會以明信片形式出現在這裡。"}</div>
      </section>

      <section className="panel wide">
        <h3>進度總覽</h3>
        <ProgressMatrix characters={participant.characters} generations={generations} />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Add review component**

Create `components/ReviewPanel.tsx`:

```tsx
import { useState } from "react";
import { createMockGeneration } from "@/lib/mockGeneration";
import type { Generation, Participant, ReviewStatus } from "@/lib/types";

const statuses: ("all" | ReviewStatus)[] = ["all", "pending", "approved", "rejected", "regenerated"];

export function ReviewPanel({
  participant,
  generations,
  onChange,
}: {
  participant: Participant;
  generations: Generation[];
  onChange: (generation: Generation) => void;
}) {
  const [filter, setFilter] = useState<"all" | ReviewStatus>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const visible = filter === "all" ? generations : generations.filter((generation) => generation.reviewStatus === filter);

  const updateContent = (generation: Generation, generatedContent: string) => {
    onChange({ ...generation, generatedContent });
  };

  const setStatus = (generation: Generation, reviewStatus: ReviewStatus) => {
    onChange({
      ...generation,
      reviewStatus,
      approvedAt: reviewStatus === "approved" ? new Date().toISOString() : generation.approvedAt,
    });
  };

  const regenerate = async (generation: Generation) => {
    const character = participant.characters.find((item) => item.id === generation.characterId);
    if (!character || !notes[generation.id]?.trim()) return;
    const next = await createMockGeneration({
      participant,
      character,
      condition: generation.condition,
      timePointType: generation.timePointType,
      reviewerNotes: notes[generation.id],
    });
    onChange(next);
  };

  return (
    <div className="stack">
      <div className="segmented compact">
        {statuses.map((status) => (
          <button className={filter === status ? "active" : ""} key={status} onClick={() => setFilter(status)} type="button">
            {status}
          </button>
        ))}
      </div>
      {visible.length === 0 ? <div className="empty-state">目前沒有符合篩選的生成內容。</div> : null}
      {visible.map((generation) => (
        <article className="review-card" key={generation.id}>
          <div>
            <p>{generation.condition} / {generation.timePointType}</p>
            <h3>{generation.characterName}</h3>
          </div>
          <textarea value={generation.generatedContent} onChange={(event) => updateContent(generation, event.target.value)} />
          <input
            value={notes[generation.id] ?? ""}
            onChange={(event) => setNotes({ ...notes, [generation.id]: event.target.value })}
            placeholder="退回或重生原因"
          />
          <div className="button-row">
            <button className="primary-button" onClick={() => setStatus(generation, "approved")} type="button">核可</button>
            <button className="secondary-button" onClick={() => setStatus(generation, "rejected")} type="button">標記問題</button>
            <button className="secondary-button" onClick={() => regenerate(generation)} type="button">退回重生</button>
          </div>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Wire components into `app/page.tsx`**

Replace the placeholder panel content in `app/page.tsx` with conditional rendering and state update helpers:

```tsx
const updateParticipant = (participant: DashboardState["participant"]) => {
  setState((current) => ({ ...current, participant }));
};

const upsertGeneration = (generation: DashboardState["generations"][number]) => {
  setState((current) => ({
    ...current,
    generations: [
      ...current.generations.filter((item) => item.id !== generation.id),
      generation,
    ],
  }));
};
```

Use this inside the returned `.panel` area:

```tsx
{activeStep === "participant" ? (
  <ParticipantForm participant={state.participant} mode="participant" onChange={updateParticipant} />
) : null}
{activeStep === "event" ? (
  <ParticipantForm participant={state.participant} mode="event" onChange={updateParticipant} />
) : null}
{activeStep === "characters" ? (
  <CharacterForm
    characters={state.participant.characters}
    onChange={(characters) => updateParticipant({ ...state.participant, characters })}
  />
) : null}
{activeStep === "generate" ? (
  <GenerationConsole participant={state.participant} generations={state.generations} onGenerated={upsertGeneration} />
) : null}
{activeStep === "review" ? (
  <ReviewPanel participant={state.participant} generations={state.generations} onChange={upsertGeneration} />
) : null}
```

Add imports:

```tsx
import { CharacterForm } from "@/components/CharacterForm";
import { GenerationConsole } from "@/components/GenerationConsole";
import { ParticipantForm } from "@/components/ParticipantForm";
import { ReviewPanel } from "@/components/ReviewPanel";
```

- [ ] **Step 6: Add interaction styles**

Append to `app/globals.css`:

```css
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-grid.three-column {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-grid label,
.control-row label {
  display: grid;
  gap: 8px;
}

.form-grid span,
.control-row span,
.card-title {
  color: var(--muted);
  font-size: 13px;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #ffffff;
  color: var(--ink);
  padding: 12px 14px;
}

textarea {
  min-height: 148px;
  resize: vertical;
}

.stack {
  display: grid;
  gap: 16px;
}

.character-card,
.review-card {
  border: 1px solid var(--line);
  background: #fbfbf8;
  border-radius: 18px;
  padding: 18px;
}

.console-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1.1fr);
  gap: 16px;
}

.wide {
  grid-column: 1 / -1;
}

.segmented,
.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0;
}

.segmented button,
.primary-button,
.secondary-button {
  padding: 11px 16px;
}

.segmented button {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #ffffff;
  cursor: pointer;
}

.segmented button.active,
.primary-button {
  background: var(--dark);
  border-color: var(--dark);
  color: #ffffff;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.hint,
.empty-state {
  color: var(--muted);
}

.postcard {
  background: var(--dark);
  color: #ffffff;
  border-radius: 24px;
  padding: 24px;
  min-height: 260px;
}

.postcard p {
  color: #c7c7be;
  margin: 0 0 18px;
}

.postcard h3 {
  margin: 0 0 18px;
  font-size: 28px;
}

.matrix {
  display: grid;
  gap: 10px;
}

.matrix-row {
  display: grid;
  grid-template-columns: 140px repeat(6, minmax(82px, 1fr));
  gap: 8px;
  align-items: stretch;
}

.matrix-name,
.matrix-cell {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 10px;
  background: #ffffff;
}

.matrix-cell {
  display: grid;
  gap: 3px;
  color: var(--muted);
}

.matrix-cell strong {
  color: var(--ink);
}

.matrix-cell.pending,
.matrix-cell.regenerated {
  background: #ecece7;
}

.matrix-cell.approved {
  background: #dfe9df;
}

.matrix-cell.rejected {
  background: #eadfdd;
}

.review-card textarea {
  min-height: 160px;
}

@media (max-width: 960px) {
  .form-grid,
  .form-grid.three-column,
  .console-grid {
    grid-template-columns: 1fr;
  }

  .matrix-row {
    grid-template-columns: 1fr 1fr;
  }
}
```

- [ ] **Step 7: Verify complete workflow**

Run:

```bash
npm run build
npm run dev
```

Expected: build exits with code 0, dev server opens, and the browser workflow can complete participant -> event -> characters -> generate -> review.

## Task 5: Final QA, Git Readiness, And Vercel Readiness

**Files:**
- Modify: `README.md`
- Modify: files found by QA only if needed.

- [ ] **Step 1: Browser QA**

Run the dev server:

```bash
npm run dev
```

Verify in browser:

- Enter participant code and date.
- Enter real and counterfactual event text.
- Enter past and future time points.
- Fill two characters.
- Generate one real/present item for one character.
- Confirm only one matrix cell changes.
- Edit generated content in Review.
- Approve the item.
- Refresh the page and confirm the item remains.

- [ ] **Step 2: Add GitHub/Vercel notes**

Append to `README.md`:

```md
## Upload To GitHub

```bash
git init
git add .
git commit -m "feat: add research dashboard prototype"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

## Future API Integration

The current mock generation lives in `lib/mockGeneration.ts`.
In the next phase, replace it with a server route such as `app/api/generate/route.ts` that:

1. Assembles the real or counterfactual prompt.
2. Calls OpenAI.
3. Stores Participant, Character, and Generation records in Notion.
4. Returns generated content and metadata to the dashboard.
```

- [ ] **Step 3: Final verification**

Run:

```bash
npm run build
```

Expected: production build exits with code 0.

- [ ] **Step 4: Stop dev server before finishing**

If `npm run dev` is still running in this agent session, stop it with Ctrl-C.

Expected: no required command sessions remain running.
