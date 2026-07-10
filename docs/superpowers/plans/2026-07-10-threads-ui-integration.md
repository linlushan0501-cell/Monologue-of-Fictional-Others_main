# Threads-style UI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the five approved wireframes into the existing research dashboard as a responsive Threads-inspired workflow while preserving text generation, Notion persistence, mock fallback, and local records.

**Architecture:** Keep the static HTML/CSS/JavaScript frontend and the existing Vercel Function. Extend the normalized browser state with a per-participant need selection and immutable per-generation need snapshots, rebuild the DOM into participant, need, event, other, and generation views, and preserve the `/api/generate` boundary with additive traceability fields.

**Tech Stack:** HTML5, CSS custom properties and responsive CSS, browser JavaScript, localStorage, Node.js built-in test runner/assertions, Vercel Functions, OpenAI Responses API, Notion API.

## Global Constraints

- Keep the project dependency-free and do not migrate to a framework.
- Use `當下`, never `現在`, for the present-time research label.
- Each API action generates exactly one role × condition × time combination.
- Support two or three roles; never fewer than two or more than three.
- Roles contain only name and selection reason; do not show or send relationship.
- Image generation remains reserved; make no image API request.
- Preserve API text generation, Notion persistence, local mock fallback, multi-participant state, and localStorage compatibility.
- Existing generations keep immutable need category and question snapshots after the participant changes their selection.
- The UI must remain fully usable on desktop and mobile.
- The current folder lacks Git metadata; execute commit steps only after the user attaches the real repository checkout.

---

### Task 1: Need-selection state and generation snapshots

**Files:**
- Modify: `tests/ui-research-flow.test.mjs`
- Modify: `script.js`

**Interfaces:**
- Produces: `needPrompts`, an array of `{ id, label, question }` objects.
- Produces: participant fields `selectedNeedId`, `selectedNeedLabel`, and `selectedNeedQuestion`.
- Produces: generation fields `needIdSnapshot`, `needLabelSnapshot`, `needQuestionSnapshot`, `generatedImageUrl`, `imageStatus`, and `source`.
- Preserves: `normalizeParticipant(participant, index)`, `createGenerationRequest()`, and `createMockGeneration()`.

- [ ] **Step 1: Write failing state-contract tests**

Add assertions to `tests/ui-research-flow.test.mjs`:

```js
assert.match(script, /const needPrompts = \[/, "The UI should define five stable need prompts.");
for (const id of ["physiological", "safety", "belonging", "esteem", "self-actualization"]) {
  assert.match(script, new RegExp(`id:\\s*["']${id}["']`), `Need prompt ${id} should exist.`);
}
assert.match(script, /selectedNeedId/, "Participant state should store the selected need id.");
assert.match(script, /selectedNeedQuestion/, "Participant state should store the selected need question.");
assert.match(script, /needIdSnapshot/, "Generation records should snapshot the selected need.");
assert.match(script, /needQuestionSnapshot/, "Generation records should snapshot the guiding question.");
assert.match(script, /imageStatus:\s*["']reserved["']/, "Generation records should reserve image state.");
assert.doesNotMatch(script, /relationship:\s*character\.relationship/, "Generation requests should not send relationship.");
```

- [ ] **Step 2: Run the UI test and verify failure**

Run: `node tests/ui-research-flow.test.mjs`

Expected: FAIL on the missing `needPrompts` contract.

- [ ] **Step 3: Add need definitions and normalized participant fields**

At the top of `script.js`, define the five stable prompts and add blank defaults in `createParticipant`:

```js
const needPrompts = [
  { id: "physiological", label: "生理需求", question: "哪一次的生病、極度疲憊或身體創傷，讓你發現原來活著、健康不是理所當然的？" },
  { id: "safety", label: "安全需求", question: "哪一個時期或事件，讓你覺得生活失去了控制，甚至連下一步該踩在哪裡都感到不安全？" },
  { id: "belonging", label: "愛與歸屬", question: "在哪個群體（家庭、校園、職場）中，你經歷了最深刻的我屬於這裡或我被排擠在外的時刻？" },
  { id: "esteem", label: "尊重需求", question: "哪一次的成就（被肯定）或失敗（被否定），最劇烈地搖晃了你對自己能力的評價？" },
  { id: "self-actualization", label: "自我實現", question: "在哪個瞬間，你放下了賺錢、旁人眼光等現實考量，單純因為這是我真正想活出的模樣？" },
];

// Inside createParticipant
selectedNeedId: "",
selectedNeedLabel: "",
selectedNeedQuestion: "",
```

Update `normalizeParticipant` so older saved participants inherit these blank fields without losing data.

- [ ] **Step 4: Snapshot traceability and reserved image state**

In both `createMockGeneration()` and `createGenerationRequest()`, read the active participant and add:

```js
needIdSnapshot: participant.selectedNeedId,
needLabelSnapshot: participant.selectedNeedLabel,
needQuestionSnapshot: participant.selectedNeedQuestion,
generatedImageUrl: "",
imageStatus: "reserved",
source: "mock", // use "api" in normalized API success output
```

Remove relationship from the browser generation request and validation. Preserve old legacy relationship values only during participant normalization.

- [ ] **Step 5: Run the UI test and verify pass**

Run: `node tests/ui-research-flow.test.mjs`

Expected: PASS with no output.

- [ ] **Step 6: Commit when Git metadata is available**

```bash
git add script.js tests/ui-research-flow.test.mjs
git commit -m "feat: add need selection state"
```

---

### Task 2: Guided participant and need views

**Files:**
- Modify: `index.html`
- Modify: `script.js`
- Modify: `tests/ui-research-flow.test.mjs`

**Interfaces:**
- Consumes: `needPrompts` and participant need fields from Task 1.
- Produces: top-level view ids `participant-view`, `need-view`, and `workspace-view`.
- Produces: `setView(viewId)`, `selectNeed(needId)`, and `renderNeedSelection()`.
- Preserves: participant add, switch, edit, delete, and localStorage behavior.

- [ ] **Step 1: Write failing DOM and behavior tests**

Add:

```js
for (const id of ["participant-view", "need-view", "workspace-view", "need-list", "need-next"]) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `HTML should include ${id}.`);
}
assert.match(script, /function selectNeed\(needId\)/, "Need cards should update participant selection.");
assert.match(script, /function renderNeedSelection\(\)/, "Need cards should render from state.");
assert.match(script, /window\.confirm/, "Participant deletion should require confirmation.");
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/ui-research-flow.test.mjs`

Expected: FAIL because `need-view` is absent.

- [ ] **Step 3: Replace the shell with three top-level views**

In `index.html`, create semantic sections with these stable controls:

```html
<main class="app-shell">
  <section class="onboarding-view" id="participant-view">...</section>
  <section class="onboarding-view" id="need-view" hidden>
    <header class="onboarding-header">
      <p class="eyebrow">02 / 關鍵事件</p>
      <h1>生命中的關鍵事件</h1>
      <p>請先從以下五個方向，找出你曾經發生、正在經歷，或即將尚未發生的關鍵事件。</p>
    </header>
    <div class="need-list" id="need-list"></div>
    <div class="onboarding-actions">
      <button class="button button-secondary" id="need-back" type="button">返回</button>
      <button class="button button-primary" id="need-next" type="button">下一步</button>
    </div>
  </section>
  <section id="workspace-view" hidden>...</section>
</main>
```

Move the existing participant controls into `participant-view`. Keep their current ids so existing event bindings remain stable.

- [ ] **Step 4: Implement navigation and need selection**

Add a top-level state field `activeView` with normalized values `participant`, `need`, or `workspace`. Implement:

```js
function setView(viewId) {
  state.activeView = viewId;
  saveState();
  render();
}

function selectNeed(needId) {
  const need = needPrompts.find((item) => item.id === needId);
  if (!need) return;
  updateActiveParticipant({
    selectedNeedId: need.id,
    selectedNeedLabel: need.label,
    selectedNeedQuestion: need.question,
  });
}
```

`renderNeedSelection()` creates buttons with `aria-pressed`, selected styling, the need label, and its full question. Disable `need-next` until a selection exists. Add confirmation before participant deletion.

- [ ] **Step 5: Run the UI test and verify pass**

Run: `node tests/ui-research-flow.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit when Git metadata is available**

```bash
git add index.html script.js tests/ui-research-flow.test.mjs
git commit -m "feat: add guided participant flow"
```

---

### Task 3: Event and fictional-other workspace

**Files:**
- Modify: `index.html`
- Modify: `script.js`
- Modify: `tests/ui-research-flow.test.mjs`

**Interfaces:**
- Consumes: active participant and `setStep(stepId)`.
- Produces: workspace tabs with `data-step="event"`, `data-step="characters"`, and `data-step="generate"`.
- Produces: `removeCharacter(characterId)` with a two-role minimum.
- Preserves: real/counterfactual descriptions and independent past/future values.

- [ ] **Step 1: Write failing workspace tests**

Add:

```js
for (const step of ["event", "characters", "generate"]) {
  assert.match(html, new RegExp(`data-step=["']${step}["']`), `Workspace should include ${step}.`);
}
assert.match(html, /id="selected-need-context"/, "Event view should show the selected need prompt.");
assert.match(script, /function removeCharacter\(characterId\)/, "Role rows should be removable.");
assert.doesNotMatch(html, /data-field="relationship"/, "Role UI should not include relationship.");
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/ui-research-flow.test.mjs`

Expected: FAIL on `selected-need-context` or `removeCharacter`.

- [ ] **Step 3: Build the workspace header and event form**

Use the approved wireframe hierarchy:

```html
<header class="workspace-header">
  <button class="wordmark" id="return-to-participant" type="button">Monologue of<br />Fictional Others</button>
  <nav class="workspace-tabs" aria-label="研究流程">
    <button data-step="event" type="button">事件</button>
    <button data-step="characters" type="button">他者</button>
    <button data-step="generate" type="button">生成</button>
  </nav>
</header>
```

Place `selected-need-context` above two `.scenario-card` sections. Keep the existing input ids for real/counterfactual descriptions and four offset fields.

- [ ] **Step 4: Rebuild role rows without relationship**

Change the template to name and selection reason only, plus a remove button. Implement:

```js
function removeCharacter(characterId) {
  const participant = getActiveParticipant();
  if (participant.characters.length <= 2) return;
  updateActiveParticipant({
    characters: participant.characters.filter((item) => item.id !== characterId),
  });
}
```

Disable add at three roles and hide or disable remove at two. Ensure selection moves to the first remaining role when the selected role is removed.

- [ ] **Step 5: Run the test and verify pass**

Run: `node tests/ui-research-flow.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit when Git metadata is available**

```bash
git add index.html script.js tests/ui-research-flow.test.mjs
git commit -m "feat: rebuild event and role workspace"
```

---

### Task 4: Generation result, image reservation, and interactive progress

**Files:**
- Modify: `index.html`
- Modify: `script.js`
- Modify: `tests/ui-research-flow.test.mjs`

**Interfaces:**
- Consumes: `getCurrentGeneration()`, `generationId(...)`, `conditions`, and `timePoints`.
- Produces: `selectGenerationCell(characterId, condition, timePoint)`.
- Produces: result ids `result-source`, `postcard-title`, `postcard-body`, and `image-placeholder`.
- Preserves: one-at-a-time `createApiGeneration()` and `upsertGeneration()`.

- [ ] **Step 1: Write failing generation-view tests**

Add:

```js
for (const id of ["image-placeholder", "result-source", "progress-matrix", "record-list"]) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `Generation view should include ${id}.`);
}
assert.match(script, /function selectGenerationCell\(characterId, condition, timePoint\)/, "Progress cells should be selectable.");
assert.match(script, /dataset\.characterId/, "Progress cells should identify a role.");
assert.match(html + script, /圖片功能預留/, "The image region should explain its reserved state.");
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/ui-research-flow.test.mjs`

Expected: FAIL because the reserved image region and selectable cells are absent.

- [ ] **Step 3: Build the control and result layout**

Create a generation grid with a control card and a dark result card. Inside the result card use:

```html
<div class="result-copy">
  <span class="result-badge" id="result-source">尚未生成</span>
  <h2 id="postcard-title">選擇一位他者</h2>
  <p id="postcard-body">完成左側條件後，生成的獨白會顯示在這裡。</p>
</div>
<figure class="image-placeholder" id="image-placeholder" data-state="reserved">
  <div class="image-placeholder-icon" aria-hidden="true"></div>
  <figcaption>圖片功能預留</figcaption>
</figure>
```

Use `aria-live="polite"` for generation status. During text generation show a skeleton state and disable duplicate submission.

- [ ] **Step 4: Make matrix cells selectable without generating**

Implement:

```js
function selectGenerationCell(characterId, condition, timePoint) {
  state.selectedCharacterId = characterId;
  state.selectedCondition = condition;
  state.selectedTimePoint = timePoint;
  saveState();
  renderGeneratedViews();
  renderGenerationControls();
}
```

Render every cell as a `<button>` with `data-character-id`, `data-condition`, `data-time-point`, `aria-pressed`, and generated/missing status. Binding a click calls only `selectGenerationCell`; it must never call `createApiGeneration()`.

- [ ] **Step 5: Label API and mock sources accurately**

On API success, normalize `source: "api"`; on fallback use `source: "mock"`. Render `已寫入 Notion` only when `source === "api"` and `notionUrl` exists. Render `離線示意` for fallback. Preserve the API error text in a concise status message without presenting fallback as persisted research data.

- [ ] **Step 6: Run the UI test and verify pass**

Run: `node tests/ui-research-flow.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit when Git metadata is available**

```bash
git add index.html script.js tests/ui-research-flow.test.mjs
git commit -m "feat: add interactive generation workspace"
```

---

### Task 5: API traceability and relationship removal

**Files:**
- Modify: `api/generate.js`
- Modify: `tests/api-generate.test.mjs`

**Interfaces:**
- Consumes: browser request fields `need_id_snapshot`, `need_label_snapshot`, and `need_question_snapshot`.
- Produces: returned generation fields `needIdSnapshot`, `needLabelSnapshot`, `needQuestionSnapshot`, `generatedImageUrl`, `imageStatus`, and `source`.
- Preserves: OpenAI Responses URL, Notion page/table writes, prompt version, and blank image URL.

- [ ] **Step 1: Write failing API contract tests**

Add:

```js
assert.match(api, /need_id_snapshot:\s*trimText\(body\.need_id_snapshot/, "API should accept the need id snapshot.");
assert.match(api, /need_question_snapshot:\s*trimText\(body\.need_question_snapshot/, "API should accept the need question snapshot.");
assert.match(api, /needQuestionSnapshot:\s*record\.need_question_snapshot/, "API response should return the need snapshot.");
assert.doesNotMatch(api, /`角色關係：\$\{record\.relationship/, "Prompt should not use relationship.");
assert.match(api, /imageStatus:\s*["']reserved["']/, "API response should reserve future image state.");
```

- [ ] **Step 2: Run the API test and verify failure**

Run: `node tests/api-generate.test.mjs`

Expected: FAIL on missing need snapshot parsing.

- [ ] **Step 3: Parse and use need snapshot fields safely**

Extend the request record:

```js
need_id_snapshot: trimText(body.need_id_snapshot, 120),
need_label_snapshot: trimText(body.need_label_snapshot, 160),
need_question_snapshot: trimText(body.need_question_snapshot, 600),
```

Add the need label and question to `buildPrompt(record)` as event-discovery context. Explicitly state that this context guides emphasis but cannot add facts. Remove the relationship line and relationship parsing.

Do not add new Notion table properties in this phase because unknown database columns would make existing writes fail. Page-mode records may include need fields in the generic field list.

- [ ] **Step 4: Return additive generation metadata**

In the success response generation object add:

```js
needIdSnapshot: record.need_id_snapshot,
needLabelSnapshot: record.need_label_snapshot,
needQuestionSnapshot: record.need_question_snapshot,
generatedImageUrl: "",
imageStatus: "reserved",
source: "api",
```

- [ ] **Step 5: Run API and UI tests**

Run: `node tests/api-generate.test.mjs && node tests/ui-research-flow.test.mjs`

Expected: both commands exit 0 with no assertion output.

- [ ] **Step 6: Commit when Git metadata is available**

```bash
git add api/generate.js tests/api-generate.test.mjs
git commit -m "feat: trace need context in generations"
```

---

### Task 6: Threads-inspired responsive visual system

**Files:**
- Modify: `style.css`
- Modify: `tests/ui-research-flow.test.mjs`

**Interfaces:**
- Consumes: semantic classes introduced in Tasks 2–4.
- Produces: responsive breakpoints at `900px` and `640px`.
- Produces: visible `:focus-visible`, selected, loading, error, and reserved states.

- [ ] **Step 1: Write failing visual-contract tests**

Read `style.css` in `tests/ui-research-flow.test.mjs` and add:

```js
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
assert.match(css, /--ink:\s*#0a0a0a/, "Visual system should use near-black ink.");
assert.match(css, /:focus-visible/, "Keyboard focus should be visible.");
assert.match(css, /@media\s*\(max-width:\s*900px\)/, "Tablet layout should be responsive.");
assert.match(css, /@media\s*\(max-width:\s*640px\)/, "Mobile layout should be responsive.");
assert.match(css, /\.image-placeholder\[data-state=["']reserved["']\]/, "Reserved image state should be styled.");
```

- [ ] **Step 2: Run the UI test and verify failure**

Run: `node tests/ui-research-flow.test.mjs`

Expected: FAIL on the new visual token contract.

- [ ] **Step 3: Replace the old dashboard skin**

Define tokens and base behavior:

```css
:root {
  --page: #ffffff;
  --surface: #f7f7f7;
  --surface-strong: #efefef;
  --ink: #0a0a0a;
  --muted: #737373;
  --line: #dedede;
  --danger: #d94a42;
  --radius-card: 18px;
  --radius-control: 14px;
  --content-max: 1440px;
}

:focus-visible {
  outline: 3px solid rgba(10, 10, 10, 0.24);
  outline-offset: 3px;
}
```

Style onboarding as a centered reading column; style the workspace with a large wordmark, pill tabs, light scenario/role cards, a dark result card, and restrained borders. Avoid decorative gradients and heavy shadows.

- [ ] **Step 4: Add responsive layouts and state styles**

At 900px stack event and generation grids. At 640px reduce page padding, scale the wordmark with `clamp`, make navigation horizontally usable, stack result text and image, and constrain progress overflow. Add explicit styles for selected need cards, generated/missing matrix cells, skeleton loading, error text, and:

```css
.image-placeholder[data-state="reserved"] {
  border: 1px dashed #555;
  background: #151515;
  color: #a8a8a8;
}
```

- [ ] **Step 5: Run the UI test and verify pass**

Run: `node tests/ui-research-flow.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit when Git metadata is available**

```bash
git add style.css tests/ui-research-flow.test.mjs
git commit -m "style: apply Threads-inspired interface"
```

---

### Task 7: Full verification and delivery notes

**Files:**
- Modify: `README.md`
- Modify: `tests/ui-research-flow.test.mjs` only if verification reveals a missing regression assertion.
- Modify: `tests/api-generate.test.mjs` only if verification reveals a missing API regression assertion.

**Interfaces:**
- Consumes: the completed static frontend and Vercel Function.
- Produces: verified local workflow and GitHub Desktop/Vercel handoff instructions.

- [ ] **Step 1: Update README workflow and environment notes**

Document the participant → need → event → others → generate flow, the reserved image behavior, and that `OPENAI_IMAGE_MODEL` is not called in this phase. Preserve the existing Vercel environment variable and Notion schema instructions.

- [ ] **Step 2: Run the complete automated suite**

Run:

```bash
node tests/ui-research-flow.test.mjs
node tests/api-generate.test.mjs
```

Expected: both exit 0 with no assertion output.

- [ ] **Step 3: Start a local server**

Run: `python3 -m http.server 3000`

Expected: server remains available at `http://localhost:3000`.

- [ ] **Step 4: Perform browser QA**

Verify at desktop and mobile widths:

1. Add and switch participants.
2. Select a need, continue, return, and change it.
3. Enter both event conditions and four offset values.
4. Keep two roles, add a third, and remove it.
5. Select all control dimensions and generate one record.
6. Confirm only the selected matrix cell changes.
7. Click missing and generated matrix cells and confirm no unintended API call.
8. Refresh and confirm state persists.
9. Confirm the image panel remains reserved and makes no request.
10. Confirm browser console has no uncaught errors.

- [ ] **Step 5: Stop the local server and re-run tests**

Run the two Node test commands again.

Expected: PASS after browser QA.

- [ ] **Step 6: Commit when Git metadata is available**

```bash
git add README.md index.html style.css script.js api/generate.js tests
git commit -m "feat: integrate Threads-style research workflow"
```

- [ ] **Step 7: Hand off GitHub Desktop and Vercel steps**

Tell the user to add or open the actual repository in GitHub Desktop, review the file list, commit with `feat: integrate Threads-style research workflow`, push the active branch, and inspect the linked Vercel deployment on desktop and mobile.
