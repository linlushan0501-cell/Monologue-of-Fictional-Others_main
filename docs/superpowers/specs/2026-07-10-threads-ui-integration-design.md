# Threads-style UI Integration Design

## Goal

Replace the current research dashboard presentation with a guided, Threads-inspired interface based on the five supplied wireframes. Preserve the existing text-generation, Notion persistence, participant management, local persistence, mock fallback, and per-combination generation records. Add the five-need event prompt flow and reserve a production-ready location for future image generation without calling an image API in this phase.

## Product Scope

This phase includes:

- A participant entry and management screen.
- A five-card key-event prompt screen.
- A three-section workspace for event, fictional others, and generation.
- A Threads-inspired monochrome visual system.
- Two to three fictional-other roles with name and selection reason only.
- One-at-a-time text generation across role, condition, and time dimensions.
- An interactive 18-cell maximum progress overview for three roles.
- A text result panel and a reserved image panel with empty, loading, and error states.
- Existing OpenAI text generation and automatic Notion writes.
- Existing local mock fallback and localStorage persistence.
- Responsive desktop and mobile layouts.

This phase excludes:

- Image generation API calls.
- Image upload.
- Manual approval, rejection, or regeneration review workflows.
- Authentication.
- Changes to the physical-device scope.
- Migration to a JavaScript framework.

## User Flow

### 1. Participant entry

The first screen allows the researcher to:

- Select an existing participant.
- Create a participant with an automatically suggested code.
- Edit the participant code and interview date.
- Delete the active participant after explicit confirmation.
- Continue to the need-selection screen.

Adding a participant creates a separate participant state. Deleting a participant also deletes only that participant's local generation records.

### 2. Key-event need selection

The second screen presents five selectable prompt cards:

1. Physiological needs.
2. Safety needs.
3. Love and belonging.
4. Esteem needs.
5. Self-actualization.

Each card contains its approved guiding question from wireframe 2. Exactly one card is the participant's current selection. Selecting a card and continuing stores both a stable category identifier and the displayed question in the participant record.

The researcher can return to this screen later and change the current selection. Existing generations do not change: every generation stores a snapshot of the category and question used at generation time.

### 3. Main workspace

The main workspace has three persistent navigation items:

- Event.
- Fictional others.
- Generate.

Changing sections does not clear or reset form data. A secondary control allows the researcher to return to participant or need selection.

### 4. Event section

The selected need category and guiding question appear above the event form as context.

The event form contains two parallel condition panels:

- Real key event: description, past offset, and future offset.
- Counterfactual scenario: description, past offset, and future offset.

The present time point is always labelled `當下` and does not require a custom value.

### 5. Fictional-others section

The participant starts with two role rows and may add a third. Each role contains:

- Role name.
- Selection reason.

Relationship is deliberately removed from the interface, generation request, and prompt. The interface allows reducing the list back to two roles but never below two or above three.

### 6. Generate section

The generation controls select exactly one:

- Role.
- Condition: real or counterfactual.
- Time: past, present, or future.

The generate button calls the existing Vercel Function for the active combination only. The text result area shows a loading skeleton, then the generated monologue. Successful API generations continue to write automatically to Notion.

If the API request fails, the existing local mock fallback produces an explicitly labelled offline demonstration. Offline results must not imply that Notion persistence succeeded.

The image panel reserves a stable aspect ratio beside the text. It supports empty, loading, success, and error presentation states in the UI and state model, but no image request is made in this phase. The default state says that image generation is reserved for a later phase.

### 7. Progress and records

For each role, the progress overview displays six cells:

- Real / past.
- Real / present.
- Real / future.
- Counterfactual / past.
- Counterfactual / present.
- Counterfactual / future.

With three roles, the overview contains 18 cells. Generated and missing states are visually distinct.

Clicking a generated cell selects that role, condition, and time and displays its record. Clicking a missing cell updates the generation controls but does not call the API. A record detail area shows the selected generation and its metadata.

## Data Model

### Participant additions

Each participant stores:

- `selectedNeedId`: stable identifier for the selected need.
- `selectedNeedLabel`: display label.
- `selectedNeedQuestion`: current guiding question.

Older localStorage data without these fields remains valid and opens with no selected need.

### Character changes

Characters store:

- `id`.
- `name`.
- `selectionReason`.

Legacy `relationship` values may be ignored during normalization. They are not shown or sent to the API.

### Generation additions

Each generation also stores:

- `needIdSnapshot`.
- `needLabelSnapshot`.
- `needQuestionSnapshot`.
- `generatedImageUrl`, initially empty.
- `imageStatus`, initially `reserved`.
- `notionUrl` when supplied by the API.
- A source indicator that distinguishes API output from offline mock output.

Changing a participant's selected need never rewrites these snapshot fields.

## Visual System

The interface uses a restrained Threads-inspired system rather than duplicating the Threads product:

- White and warm-grey backgrounds with black text.
- Fine neutral borders.
- Rounded pill navigation and segmented controls.
- Black selected states with white text.
- Minimal shadows, used only where depth clarifies hierarchy.
- Large brand typography on desktop and compact typography on small screens.
- Comfortable reading width for monologue text.
- Generous whitespace and consistent vertical rhythm.

The supplied wireframes define the information hierarchy, not exact pixel styling. The implementation improves alignment, responsive behavior, state feedback, and accessibility while keeping their composition recognizable.

## Responsive Behavior

Desktop uses:

- A wide brand-and-navigation header.
- Two-column real/counterfactual event panels.
- A control column beside the result card.
- Text and image areas side by side inside the result card.

On narrow screens:

- Header content stacks.
- Navigation remains horizontally scrollable or wraps without clipping.
- Event panels become a single column.
- Generation controls, text, and image become a single column.
- Progress cells remain legible through a compact grid or contained horizontal overflow.

No feature is removed at mobile widths.

## Validation and Error Handling

The generate action is disabled until the active combination has:

- A participant code.
- A selected need.
- The relevant real or counterfactual event description.
- A value for past or future when one of those times is selected.
- A named role.

Short inline validation messages appear at the relevant area. The interface also handles:

- Invalid or older localStorage data by normalization rather than crashing.
- API loading without allowing duplicate submissions.
- API errors with an explicit offline fallback label.
- Notion failures without claiming successful persistence.
- Participant deletion with confirmation.
- Reserved image state without suggesting an image is currently being generated.

## API and Notion Integration

The existing `/api/generate` boundary remains in place.

The request continues to include participant, condition, time, event, role, selection reason, and prompt-version metadata. It adds the need snapshot fields so the research context can be traced. Relationship is removed from required fields and prompt content.

The image URL remains blank. Existing Notion image-related properties can remain configured so a future phase can populate them without a schema rewrite.

If the configured Notion table does not yet have need-related columns, the API must not send unknown properties that would break writes. Need snapshots remain guaranteed in browser generation records; adding Notion columns for them is a separate explicit schema migration unless the existing integration can store them safely in a generic page format.

## Testing and Verification

Automated tests cover:

- Presence and selection of all five need cards.
- Need selection persistence per participant.
- Returning and changing a need.
- Immutable need snapshots on older generations.
- Multiple participant add, switch, and confirmed delete behavior.
- Two-role minimum and three-role maximum.
- Absence of the relationship field in UI and generation prompt.
- Single-combination generation.
- All six combinations per role and 18 cells for three roles.
- Generated-cell selection and missing-cell non-generation behavior.
- Existing OpenAI and Notion request boundaries.
- Mock fallback source labelling.
- Reserved image state and future image data fields.
- Responsive structural classes and accessibility states where practical.

Verification requires:

1. Run the full Node test suite.
2. Start a local static server with Vercel-compatible API behavior where available.
3. Visually verify desktop and mobile layouts.
4. Exercise the full participant → need → event → other → generation flow.
5. Confirm localStorage survives refresh.
6. Confirm a successful configured API call writes to Notion.

## GitHub and Vercel Delivery

The implementation remains a static frontend plus Vercel Function, so the existing Vercel project structure remains compatible.

After verification:

1. Review the changed files in GitHub Desktop.
2. Commit with a focused message such as `feat: integrate Threads-style research workflow`.
3. Push the repository branch through GitHub Desktop.
4. Let the linked Vercel project build the pushed commit automatically.
5. Inspect the deployment URL on desktop and mobile.

The current workspace does not contain Git metadata. Codex can implement and verify files here, but cannot create a repository commit or confirm the GitHub remote until the folder is attached to or replaced by the actual Git checkout.

## Success Criteria

The phase is complete when:

- The five supplied wireframes are represented by a coherent guided workflow.
- The UI has a polished Threads-inspired monochrome style.
- All existing generation and persistence behaviors still work.
- The need prompt is selectable, revisitable, and traceable in generation snapshots.
- Roles use only name and selection reason.
- The image area is ready for a later API integration without making image calls now.
- The 18 possible combinations are visible and navigable for three roles.
- Automated tests pass and desktop/mobile browser QA shows no blocking issues.
- The folder is ready for the user to commit and push through GitHub Desktop for Vercel deployment.
