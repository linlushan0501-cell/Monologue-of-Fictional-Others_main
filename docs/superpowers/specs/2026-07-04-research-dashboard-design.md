# Research Dashboard First Version Design

## Goal

Build a GitHub- and Vercel-ready first version of a researcher-facing web dashboard for generating and reviewing fictional "other-role monologues" from interview data.

This first version focuses on the complete front-end workflow. OpenAI and Notion integrations are intentionally stubbed for a later phase, but the UI and data shapes should match the future API flow.

## Product Direction

The interface is a desktop web dashboard, not a mobile app. It combines:

- A left sidebar from a formal research console.
- A step-by-step main flow based on the current workflow sketch.
- A soft grey/white visual style inspired by the reference image: pill controls, rounded panels, high contrast result cards, and quiet monochrome surfaces.

The first screen should feel like a working research tool rather than a landing page.

## First-Version Scope

In scope:

- Participant and interview date input.
- Real event and counterfactual event input.
- Past and future time-point input.
- Character entry for 2 to 3 roles, with name, relationship, and selection reason.
- Single-generation control surface:
  - character selector
  - real/counterfactual toggle
  - past/present/future selector
  - one generate button for the selected combination only
- Simulated generation with a short delay.
- Generated result shown as a postcard-style card.
- Progress matrix showing role x condition x time-point status.
- Review list with status filters.
- Review actions:
  - approve
  - mark rejected/problematic
  - regenerate with reviewer note
  - edit generated text before approval
- Local front-end persistence, preferably `localStorage`, so a browser refresh does not erase the current prototype state.
- API boundary files or functions named clearly enough to replace mock generation with OpenAI and Notion calls later.

Out of scope:

- Real OpenAI API calls.
- Real Notion API writes.
- Authentication.
- Raspberry Pi or physical device behavior.
- Image generation or image upload.
- Multi-participant database management beyond the active participant prototype.

## Architecture

Use Next.js with the App Router.

Suggested structure:

- `app/page.tsx`: main dashboard shell and active step routing.
- `app/layout.tsx`: metadata and global page frame.
- `app/globals.css`: global visual system and responsive layout.
- `components/Sidebar.tsx`: fixed web navigation.
- `components/StepFlow.tsx`: step tabs or progress navigation.
- `components/ParticipantForm.tsx`: participant, event, and time-point inputs.
- `components/CharacterForm.tsx`: 2 to 3 character editor.
- `components/GenerationConsole.tsx`: single-generation controls and result card.
- `components/ProgressMatrix.tsx`: read-only generation status overview.
- `components/ReviewPanel.tsx`: review filters, editable content, and status actions.
- `lib/types.ts`: Participant, Character, Generation, review status, condition, and time-point types.
- `lib/mockGeneration.ts`: mock prompt assembly and simulated generation.
- `lib/storage.ts`: localStorage load/save helpers.
- Future extension point: `app/api/generate/route.ts` can later call OpenAI, then Notion.

For the first version, the page can be a client-side application because the prototype state is local and interactive.

## Data Model

Use the technical specification as the source of truth.

Participant:

- id
- code or name
- interviewDate
- realEventDescription
- counterfactualDescription
- pastTimePoint
- futureTimePoint
- characters

Character:

- id
- name
- relationship
- selectionReason

Generation:

- id
- participantId
- characterId
- characterName
- condition: `real` or `counterfactual`
- timePointType: `past`, `present`, or `future`
- timePointValue
- generatedContent
- generationTimestamp
- promptVersion
- reviewStatus: `pending`, `approved`, `rejected`, or `regenerated`
- reviewerNotes
- approvedAt

Each character can eventually produce 6 generations: real/counterfactual x past/present/future.

## User Flow

1. Researcher opens the dashboard.
2. Left sidebar shows the main sections:
   - Participant
   - Event
   - Characters
   - Generate
   - Review
3. Main content uses step flow navigation, so the researcher can move forward without losing context.
4. Researcher enters participant code and interview date.
5. Researcher enters the real event, counterfactual event, past time point, and future time point.
6. Researcher enters 2 to 3 characters.
7. Researcher moves to Generate:
   - selects one character
   - chooses real or counterfactual
   - chooses past, present, or future
   - clicks Generate
8. The app waits briefly, creates one simulated Generation, and displays it as a postcard card.
9. The progress matrix updates that one combination to pending.
10. Researcher moves to Review:
    - filters by status
    - edits generated text if needed
    - approves, rejects, or requests regeneration

## Visual Design

The site should use a restrained research-console aesthetic:

- Background: warm off-white or near-white.
- Panels: white and light neutral grey.
- Primary dark card: charcoal for the most important generated output or selected state.
- Accent: minimal, used only for status or small controls.
- Controls: pill toggles and segmented buttons.
- Cards: subtle borders, radius no larger than needed for a polished dashboard.
- Typography: large enough for research work, but not hero-like inside tool panels.

The layout is desktop-first but must remain usable on tablets and narrow screens. On mobile widths, the sidebar can collapse above the content or become a compact top navigation.

## Component Behavior

Participant and Event forms:

- Save values into local state.
- Validate minimally: participant code, real event, counterfactual event, and at least 2 characters before generation.

Character editor:

- Starts with 2 character slots.
- Allows adding a third character.
- Does not allow more than 3 characters in this prototype.

Generation console:

- Allows only one selected role, condition, and time point at a time.
- Generate button is disabled until required fields exist.
- Shows loading for 1 to 2 seconds.
- Replaces or updates the generation for the selected combination if regenerated.

Progress matrix:

- Read-only.
- Shows missing, pending, approved, rejected, and regenerated states.
- Does not trigger generation by clicking cells.

Review panel:

- Shows generated items.
- Allows status filtering.
- Supports manual editing of generated content.
- Regenerate requires reviewer notes.
- Approved items record `approvedAt`.

## Mock Generation

The prototype generation should build output from the same parameters as the future prompt:

- character name
- relationship
- selection reason
- real or counterfactual description
- time-point type
- time-point value where relevant

Mock content should be clearly plausible but not presented as real AI output. It should include the character label, for example `【爸爸】`, and be written in first person to match the future prompt style.

## Error Handling

Because the first version is local-only, error handling is mostly validation:

- Prevent generation when the active participant, event, time points, or character data is incomplete.
- Show concise inline messages near the relevant controls.
- If localStorage parsing fails, reset to default prototype state rather than crashing.

Future API errors should map naturally to:

- generation failed
- Notion write failed
- missing environment variables
- rate limit or provider error

## Testing And Verification

Manual verification for the first version:

- App loads locally.
- Researcher can complete all steps.
- At least 2 characters can be entered.
- Generate creates exactly one item for the selected role/condition/time point.
- Progress matrix updates only that cell.
- Review filter works.
- Generated text can be edited.
- Approve/reject/regenerate changes status correctly.
- Page refresh preserves prototype state.
- Production build succeeds.

Automated tests are optional for the first version unless the implementation naturally includes a test runner. The minimum required verification is lint/build plus browser QA.

## Future Integration Notes

Later OpenAI integration should replace `mockGeneration` with a server-side route that:

- assembles the REAL or COUNTERFACTUAL prompt
- calls OpenAI
- records prompt version and timestamp
- returns generated content plus metadata

Later Notion integration should:

- create or update Participant, Character, and Generation database records
- store input snapshots for traceability
- preserve review status and notes

The first version should keep naming and data shapes close to these future integrations so the next phase is additive rather than a rewrite.
