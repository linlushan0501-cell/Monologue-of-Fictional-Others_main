import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const compactCss = readFileSync(new URL("../compact.css", import.meta.url), "utf8");

assert.match(script, /const needPrompts = \[/, "The UI should define five stable need prompts.");
for (const id of ["physiological", "safety", "belonging", "esteem", "self-actualization"]) {
  assert.match(script, new RegExp(`id:\\s*["']${id}["']`), `Need prompt ${id} should exist.`);
}
assert.match(script, /selectedNeedId/, "Participant state should store the selected need id.");
assert.match(script, /needIdSnapshot/, "Generation records should snapshot the selected need.");
assert.match(script, /needQuestionSnapshot/, "Generation records should snapshot the guiding question.");
assert.match(script, /imageStatus:\s*["']reserved["']/, "Generation records should reserve image state.");
assert.doesNotMatch(script, /relationship:\s*character\.relationship/, "Generation requests should not send relationship.");

for (const id of ["participant-view", "need-view", "workspace-view", "need-list", "need-next", "image-placeholder", "result-source"]) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `HTML should include ${id}.`);
}
assert.match(script, /function selectNeed\(needId\)/, "Need cards should update participant selection.");
assert.match(script, /function renderNeedSelection\(\)/, "Need cards should render from state.");
assert.match(script, /window\.confirm/, "Participant deletion should require confirmation.");
assert.match(html, /id="selected-need-context"/, "Event view should show the selected need prompt.");
assert.doesNotMatch(html, /data-field="relationship"/, "Role UI should not include relationship.");
assert.match(script, /function selectGenerationCell\(characterId, condition, timePoint\)/, "Progress cells should be selectable.");
assert.match(html + script, /圖片功能預留/, "The image region should explain its reserved state.");

assert.match(css, /--ink:\s*#0a0a0a/, "Visual system should use near-black ink.");
assert.match(css, /:focus-visible/, "Keyboard focus should be visible.");
assert.match(css, /@media\s*\(max-width:\s*900px\)/, "Tablet layout should be responsive.");
assert.match(css, /@media\s*\(max-width:\s*640px\)/, "Mobile layout should be responsive.");
assert.match(css, /\.image-placeholder\[data-state=["']reserved["']\]/, "Reserved image state should be styled.");
assert.doesNotMatch(html, /01 \/ Participant|建立或選擇參與者|下一步：設定他者|至少 2 位，最多 3 位|新增第三位他者|下一步：開始生成|一次生成一個組合/, "Removed helper copy and controls should stay removed.");
assert.match(html, /id="need-back"[^>]*aria-label="返回"/, "Need view should use an accessible back arrow.");
assert.match(script, /characters:\s*\[createCharacter\(1\), createCharacter\(2\), createCharacter\(3\)\]/, "Participants should start with exactly three roles.");
assert.doesNotMatch(html, /class="remove-character"/, "Fixed roles should not expose remove controls.");
assert.match(html, /class="workspace-sidebar"/, "Workspace should use one sidebar.");
assert.match(html, /id="sidebar-need"/, "Sidebar should allow returning to need selection.");
assert.doesNotMatch(html, /class="workspace-tabs"/, "The old top pill navigation should be removed.");
assert.match(html, /<small>01<\/small> 事件/, "Sidebar should number the event step.");
assert.match(html, /<small>02<\/small> 他者/, "Sidebar should number the others step.");
assert.match(html, /<small>03<\/small> 生成/, "Sidebar should number the generate step.");
assert.match(compactCss, /data:image\/svg\+xml/, "Selects should use one explicit SVG arrow.");
assert.match(compactCss, /right 36px center/, "Select arrows should be inset from the edge.");
assert.match(compactCss, /#participant-view \.onboarding-header,#need-view \.onboarding-header\{margin-top:auto\}/, "Onboarding content should be vertically centered.");

assert.match(html, /id="participant-select"/, "UI should let researchers switch participants.");
assert.match(html, /id="add-participant"/, "UI should let researchers add another participant.");
assert.match(html, /id="delete-participant"/, "UI should let researchers delete the active participant.");
assert.match(script, /code: `P-\$\{String\(index\)\.padStart\(3, "0"\)\}`/, "Participant labels should start from P-001.");
assert.match(script, /participants:/, "State should store multiple participants.");
assert.match(script, /activeParticipantId/, "State should track the active participant.");
assert.match(script, /getActiveParticipant/, "Code should read data through the active participant.");
assert.match(script, /participantId === participant\.id/, "Generated records should be scoped to the active participant.");

assert.doesNotMatch(html + script, /此時此刻/, "The UI/mock output should not use the stiff phrase 此時此刻.");
assert.doesNotMatch(html + script, /我站在/, "Mock monologues should not force a spatial time-travel opening.");
assert.doesNotMatch(html + script, /聽完|聽到這段|第一個反應/, "Mock output should not sound like a listener commenting on the participant's story.");
assert.doesNotMatch(html + script, /這件事對我來說|旁人的故事/, "Mock output should not use abstract template phrasing.");
assert.match(script, /pickVariant/, "Mock output should vary wording instead of using one fixed public template.");
assert.match(script, /我看到|我記得|我注意到/, "Mock output should start from natural observation language.");
assert.match(html + script, /當下/, "The present-time condition should be labeled 當下.");
assert.match(script, /condition === "real" \? "現在" : "當下"/, "Present label should depend on the selected condition.");
assert.match(html + script, /真實/, "The experimental condition should be labeled 真實.");
assert.match(html + script, /反事實/, "The experimental condition should be labeled 反事實.");
assert.doesNotMatch(html + script, /請先完成目前條件/, "The UI should not show extra instructional hint text.");

assert.doesNotMatch(html + script, /核可|退回|重生|審閱/, "The experiment UI should not imply subjective review/regeneration.");
assert.match(html, /<span class="stamp">V3<\/span>/, "The UI version stamp should match the current prompt version.");
