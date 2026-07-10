const steps = [
  { id: "event", label: "事件" },
  { id: "characters", label: "他者" },
  { id: "generate", label: "生成" },
];
const needPrompts = [
  { id: "physiological", label: "生理需求", question: "哪一次的生病、極度疲憊或身體創傷，讓你發現原來活著、健康不是理所當然的？" },
  { id: "safety", label: "安全需求", question: "哪一個時期或事件，讓你覺得生活失去了控制，甚至連下一步該踩在哪裡都感到不安全？" },
  { id: "belonging", label: "愛與歸屬", question: "在哪個群體（家庭、校園、職場）中，你經歷了最深刻的我屬於這裡或我被排擠在外的時刻？" },
  { id: "esteem", label: "尊重需求", question: "哪一次的成就（被肯定）或失敗（被否定），最劇烈地搖晃了你對自己能力的評價？" },
  { id: "self-actualization", label: "自我實現", question: "在哪個瞬間，你放下了賺錢、旁人眼光等現實考量，單純因為這是我真正想活出的模樣？" },
];
const conditions = ["real", "counterfactual"];
const timePoints = ["past", "present", "future"];
const storageKey = "research-monologue-dashboard-static-v1";
const promptVersion = "openai-notion-v3";
const promptVersionReason = "v3: 避免複述輸入敘事；以角色脈絡生成獨白。";
const promptVersionReasonKey = `${storageKey}-${promptVersion}-reason`;
const labels = { real: "真實", counterfactual: "反事實", past: "過去", present: "當下", future: "未來" };

function createCharacter(index) {
  return { id: `character-${Date.now()}-${index}`, name: "", selectionReason: "" };
}
function createParticipant(index) {
  return {
    id: `participant-${Date.now()}-${index}`,
    code: `P-${String(index).padStart(3, "0")}`,
    interviewDate: "",
    selectedNeedId: "",
    selectedNeedLabel: "",
    selectedNeedQuestion: "",
    realEventDescription: "",
    counterfactualDescription: "",
    realPastTimePoint: "",
    realFutureTimePoint: "",
    counterfactualPastTimePoint: "",
    counterfactualFutureTimePoint: "",
    characters: [createCharacter(1), createCharacter(2)],
  };
}
const firstParticipant = createParticipant(1);
const defaultState = {
  activeView: "participant",
  activeStep: "event",
  activeParticipantId: firstParticipant.id,
  selectedCondition: "real",
  selectedTimePoint: "present",
  selectedCharacterId: firstParticipant.characters[0].id,
  participants: [firstParticipant],
  generations: [],
  isGenerating: false,
  generationError: "",
};
let state = loadState();

function cloneDefaultState() { return structuredClone(defaultState); }
function normalizeParticipant(participant = {}, index = 1) {
  const next = { ...createParticipant(index), ...participant };
  const legacyPast = participant.pastTimePoint || "";
  const legacyFuture = participant.futureTimePoint || "";
  next.realPastTimePoint ||= legacyPast;
  next.realFutureTimePoint ||= legacyFuture;
  next.counterfactualPastTimePoint ||= legacyPast;
  next.counterfactualFutureTimePoint ||= legacyFuture;
  next.characters = (participant.characters?.length ? participant.characters : [createCharacter(1), createCharacter(2)])
    .slice(0, 3)
    .map((character, characterIndex) => ({ id: character.id || `character-${Date.now()}-${characterIndex}`, name: character.name || "", selectionReason: character.selectionReason || "" }));
  while (next.characters.length < 2) next.characters.push(createCharacter(next.characters.length + 1));
  return next;
}
function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const participants = parsed.participants?.length ? parsed.participants.map(normalizeParticipant) : [normalizeParticipant(parsed.participant || {}, 1)];
    const next = { ...cloneDefaultState(), ...parsed, participants, generations: parsed.generations || [], isGenerating: false };
    if (!participants.some((participant) => participant.id === next.activeParticipantId)) next.activeParticipantId = participants[0].id;
    if (!steps.some((step) => step.id === next.activeStep)) next.activeStep = "event";
    if (!["participant", "need", "workspace"].includes(next.activeView)) next.activeView = "participant";
    const active = getActiveParticipantFromState(next);
    if (!active.characters.some((character) => character.id === next.selectedCharacterId)) next.selectedCharacterId = active.characters[0].id;
    return next;
  } catch { return cloneDefaultState(); }
}
function saveState() { localStorage.setItem(storageKey, JSON.stringify({ ...state, isGenerating: false })); }
function byId(id) { return document.getElementById(id); }
function getActiveParticipantFromState(sourceState) { return sourceState.participants.find((participant) => participant.id === sourceState.activeParticipantId) || sourceState.participants[0]; }
function getActiveParticipant() { return getActiveParticipantFromState(state); }
function getActiveGenerations() { const participant = getActiveParticipant(); return state.generations.filter((generation) => generation.participantId === participant.id); }
function updateActiveParticipant(patch) {
  const participant = getActiveParticipant();
  state.participants = state.participants.map((item) => item.id === participant.id ? { ...item, ...patch } : item);
  saveState();
}
function updateParticipant(field, value) { updateActiveParticipant({ [field]: value }); renderGeneratedViews(); }
function setView(viewId) { state.activeView = viewId; saveState(); render(); }
function setStep(stepId) { state.activeStep = stepId; state.activeView = "workspace"; saveState(); render(); }
function selectNeed(needId) {
  const need = needPrompts.find((item) => item.id === needId);
  if (!need) return;
  updateActiveParticipant({ selectedNeedId: need.id, selectedNeedLabel: need.label, selectedNeedQuestion: need.question });
  renderNeedSelection();
}
function setActiveParticipant(participantId) {
  state.activeParticipantId = participantId;
  state.selectedCharacterId = getActiveParticipant().characters[0]?.id || "";
  saveState(); render();
}
function updateCharacter(id, field, value) {
  const participant = getActiveParticipant();
  updateActiveParticipant({ characters: participant.characters.map((character) => character.id === id ? { ...character, [field]: value } : character) });
  renderGenerationControls();
}
function removeCharacter(characterId) {
  const participant = getActiveParticipant();
  if (participant.characters.length <= 2) return;
  const characters = participant.characters.filter((item) => item.id !== characterId);
  updateActiveParticipant({ characters });
  if (!characters.some((item) => item.id === state.selectedCharacterId)) state.selectedCharacterId = characters[0].id;
  saveState(); render();
}
function getSelectedCharacter() { const participant = getActiveParticipant(); return participant.characters.find((character) => character.id === state.selectedCharacterId) || participant.characters[0]; }
function getScenarioDescription(condition) { const participant = getActiveParticipant(); return condition === "real" ? participant.realEventDescription : participant.counterfactualDescription; }
function getTimePointValue(condition, timePoint) {
  const p = getActiveParticipant();
  if (timePoint === "present") return "當下";
  if (condition === "real") return timePoint === "past" ? p.realPastTimePoint : p.realFutureTimePoint;
  return timePoint === "past" ? p.counterfactualPastTimePoint : p.counterfactualFutureTimePoint;
}
function generationId(participantId, characterId, condition, timePoint) { return `${participantId}-${characterId}-${condition}-${timePoint}`; }
function getCurrentGeneration() {
  const participant = getActiveParticipant(); const character = getSelectedCharacter();
  return state.generations.find((generation) => generation.participantId === participant.id && generation.characterId === character?.id && generation.condition === state.selectedCondition && generation.timePointType === state.selectedTimePoint);
}
function validationMessage() {
  const p = getActiveParticipant(); const c = getSelectedCharacter();
  if (!p.code.trim()) return "請先填寫參與者 ID。";
  if (!p.selectedNeedId) return "請先選擇生命需求提示。";
  if (!getScenarioDescription(state.selectedCondition).trim()) return `請先填寫${labels[state.selectedCondition]}事件。`;
  if (state.selectedTimePoint !== "present" && !getTimePointValue(state.selectedCondition, state.selectedTimePoint).trim()) return `請先填寫${labels[state.selectedTimePoint]}時間點。`;
  if (!c?.name.trim()) return "請先填寫他者名稱。";
  return "";
}
function hasRequiredGenerationData() { return !validationMessage(); }
function hashText(value) { return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0); }
function pickVariant(items, seed, offset = 0) { return items[(hashText(seed) + offset) % items.length]; }
function createMockGeneration() {
  const participant = getActiveParticipant(); const character = getSelectedCharacter();
  const seed = generationId(participant.id, character.id, state.selectedCondition, state.selectedTimePoint);
  const openings = ["我看到你把話說到一半又收回去。", "我記得你那天一直避開我的眼神。", "我注意到那個很短的停頓。"];
  const middles = ["我沒有追問，因為我知道再靠近一步，你就會把門關上。", "我想說點什麼，最後只把聲音放輕。", "那份沉默比你說出口的話更重。"];
  return {
    id: generationId(participant.id, character.id, state.selectedCondition, state.selectedTimePoint), participantId: participant.id, participantCode: participant.code,
    characterId: character.id, characterName: character.name || "未命名角色", selectionReason: character.selectionReason,
    condition: state.selectedCondition, timePointType: state.selectedTimePoint, timePointValue: getTimePointValue(state.selectedCondition, state.selectedTimePoint),
    generatedContent: `【${character.name}】${pickVariant(openings, seed)}${pickVariant(middles, seed, 1)}我只是希望，這一次你不用獨自把所有事情撐完。`,
    needIdSnapshot: participant.selectedNeedId, needLabelSnapshot: participant.selectedNeedLabel, needQuestionSnapshot: participant.selectedNeedQuestion,
    generatedImageUrl: "", imageStatus: "reserved", source: "mock", generationTimestamp: new Date().toISOString(), promptVersion: "static-prototype-v3", notionUrl: "",
  };
}
function createGenerationRequest() {
  const participant = getActiveParticipant(); const character = getSelectedCharacter();
  return {
    id: generationId(participant.id, character.id, state.selectedCondition, state.selectedTimePoint), participant_id: participant.code,
    participantId: participant.id, character_id: character.id, character: character.name, selection_reason: character.selectionReason,
    condition: state.selectedCondition, time_point_type: state.selectedTimePoint, time_point_label: getTimePointValue(state.selectedCondition, state.selectedTimePoint),
    event_description: getScenarioDescription(state.selectedCondition), real_event_description: participant.realEventDescription, counterfactual_event_description: participant.counterfactualDescription,
    need_id_snapshot: participant.selectedNeedId, need_label_snapshot: participant.selectedNeedLabel, need_question_snapshot: participant.selectedNeedQuestion,
    prompt_version: promptVersion, prompt_version_reason: localStorage.getItem(promptVersionReasonKey) === "recorded" ? "" : promptVersionReason,
  };
}
async function createApiGeneration() {
  const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createGenerationRequest()) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "生成失敗");
  localStorage.setItem(promptVersionReasonKey, "recorded");
  return { ...payload.generation, source: "api", imageStatus: "reserved" };
}
function upsertGeneration(generation) { state.generations = [...state.generations.filter((item) => item.id !== generation.id), generation]; saveState(); }
function selectGenerationCell(characterId, condition, timePoint) { state.selectedCharacterId = characterId; state.selectedCondition = condition; state.selectedTimePoint = timePoint; saveState(); renderGeneratedViews(); renderGenerationControls(); }

function renderViewVisibility() {
  byId("participant-view").hidden = state.activeView !== "participant";
  byId("need-view").hidden = state.activeView !== "need";
  byId("workspace-view").hidden = state.activeView !== "workspace";
}
function renderParticipantSelect() {
  const select = byId("participant-select");
  select.innerHTML = state.participants.map((participant) => `<option value="${participant.id}">${participant.code || "未命名參與者"}</option>`).join("");
  select.value = state.activeParticipantId;
  const p = getActiveParticipant(); byId("participant-code").value = p.code; byId("interview-date").value = p.interviewDate;
  byId("delete-participant").disabled = state.participants.length === 1;
}
function renderNeedSelection() {
  const participant = getActiveParticipant();
  byId("need-list").innerHTML = needPrompts.map((need) => `<button class="need-card" type="button" data-need-id="${need.id}" aria-pressed="${need.id === participant.selectedNeedId}"><strong>${need.label}</strong><p>${need.question}</p><span class="need-check">${need.id === participant.selectedNeedId ? "●" : "○"}</span></button>`).join("");
  byId("need-next").disabled = !participant.selectedNeedId;
  document.querySelectorAll("[data-need-id]").forEach((button) => button.addEventListener("click", () => selectNeed(button.dataset.needId)));
}
function renderNavigation() {
  document.querySelectorAll("[data-step]").forEach((button) => { button.classList.toggle("active", button.dataset.step === state.activeStep); button.setAttribute("aria-current", button.dataset.step === state.activeStep ? "page" : "false"); });
  document.querySelectorAll("[data-section]").forEach((section) => { section.hidden = section.dataset.section !== state.activeStep; });
}
function renderForms() {
  const p = getActiveParticipant();
  const map = { "real-event": "realEventDescription", "counterfactual-event": "counterfactualDescription", "real-past-time": "realPastTimePoint", "real-future-time": "realFutureTimePoint", "counterfactual-past-time": "counterfactualPastTimePoint", "counterfactual-future-time": "counterfactualFutureTimePoint" };
  Object.entries(map).forEach(([id, field]) => { byId(id).value = p[field]; });
  byId("selected-need-context").innerHTML = p.selectedNeedId ? `<strong>${p.selectedNeedLabel}</strong><p>${p.selectedNeedQuestion}</p>` : `<strong>尚未選擇提示</strong><p>返回提示頁選擇一個方向。</p>`;
}
function renderCharacters() {
  const participant = getActiveParticipant(); const list = byId("character-list"); list.innerHTML = "";
  participant.characters.forEach((character, index) => {
    const fragment = byId("character-template").content.cloneNode(true); const card = fragment.querySelector(".character-card");
    fragment.querySelector(".card-title").textContent = `他者 ${String(index + 1).padStart(2, "0")}`;
    fragment.querySelectorAll("input").forEach((input) => { input.value = character[input.dataset.field] || ""; input.addEventListener("input", (event) => updateCharacter(character.id, input.dataset.field, event.target.value)); });
    const remove = fragment.querySelector(".remove-character"); remove.hidden = participant.characters.length <= 2; remove.addEventListener("click", () => removeCharacter(character.id)); list.appendChild(fragment);
  });
  byId("add-character").disabled = participant.characters.length >= 3;
}
function renderGenerationControls() {
  const participant = getActiveParticipant(); const select = byId("character-select");
  select.innerHTML = participant.characters.map((character) => `<option value="${character.id}">${character.name || "未命名角色"}</option>`).join(""); select.value = state.selectedCharacterId;
  document.querySelectorAll("[data-condition]").forEach((button) => button.classList.toggle("active", button.dataset.condition === state.selectedCondition));
  document.querySelectorAll("[data-time]").forEach((button) => button.classList.toggle("active", button.dataset.time === state.selectedTimePoint));
  const message = validationMessage(); byId("generation-validation").textContent = message; byId("generate-button").disabled = Boolean(message) || state.isGenerating;
}
function renderPostcard() {
  const generation = getCurrentGeneration(); const character = getSelectedCharacter(); const body = byId("postcard-body");
  body.classList.toggle("skeleton", state.isGenerating);
  if (state.isGenerating) { byId("result-source").textContent = "生成中"; byId("postcard-title").textContent = character?.name || "他者"; body.textContent = "正在生成獨白內容，請稍候片刻。"; return; }
  byId("result-source").textContent = generation ? (generation.source === "api" ? (generation.notionUrl ? "已寫入 Notion" : "正式生成") : "離線示意") : "尚未生成";
  byId("postcard-title").textContent = generation?.characterName || character?.name || "選擇一位他者";
  body.textContent = generation?.generatedContent || "完成左側條件後，生成的獨白會顯示在這裡。";
  const link = byId("notion-link"); link.hidden = !generation?.notionUrl; if (generation?.notionUrl) link.href = generation.notionUrl;
}
function renderMatrix() {
  const participant = getActiveParticipant();
  byId("progress-matrix").innerHTML = participant.characters.map((character) => `<div class="matrix-row"><div class="matrix-role">${character.name || "未命名角色"}</div>${conditions.flatMap((condition) => timePoints.map((timePoint) => { const found = state.generations.find((generation) => generation.participantId === participant.id && generation.characterId === character.id && generation.condition === condition && generation.timePointType === timePoint); return `<button class="matrix-cell ${found ? "generated" : "missing"}" type="button" data-character-id="${character.id}" data-condition="${condition}" data-time-point="${timePoint}" aria-pressed="${state.selectedCharacterId === character.id && state.selectedCondition === condition && state.selectedTimePoint === timePoint}"><small>${labels[condition]}</small>${labels[timePoint]}</button>`; })).join("")}</div>`).join("");
  document.querySelectorAll(".matrix-cell").forEach((button) => button.addEventListener("click", () => selectGenerationCell(button.dataset.characterId, button.dataset.condition, button.dataset.timePoint)));
}
function renderRecords() {
  const generation = getCurrentGeneration(); byId("record-list").innerHTML = generation ? `<article class="record-card"><p class="record-meta">${generation.needLabelSnapshot || "未分類"} / ${labels[generation.condition]} / ${labels[generation.timePointType]}</p><h4>${generation.characterName}</h4><p>${generation.generatedContent}</p></article>` : "";
}
function renderGeneratedViews() { renderPostcard(); renderMatrix(); renderRecords(); }
function render() { renderViewVisibility(); renderParticipantSelect(); renderNeedSelection(); renderNavigation(); renderForms(); renderCharacters(); renderGenerationControls(); renderGeneratedViews(); }

function bindStaticEvents() {
  byId("participant-select").addEventListener("change", (event) => setActiveParticipant(event.target.value));
  byId("participant-code").addEventListener("input", (event) => updateParticipant("code", event.target.value));
  byId("interview-date").addEventListener("input", (event) => updateParticipant("interviewDate", event.target.value));
  byId("add-participant").addEventListener("click", () => { const participant = createParticipant(state.participants.length + 1); state.participants.push(participant); state.activeParticipantId = participant.id; state.selectedCharacterId = participant.characters[0].id; saveState(); render(); });
  byId("delete-participant").addEventListener("click", () => { if (state.participants.length <= 1 || !window.confirm("確定刪除這位參與者與其生成紀錄？")) return; const id = state.activeParticipantId; state.participants = state.participants.filter((participant) => participant.id !== id); state.generations = state.generations.filter((generation) => generation.participantId !== id); state.activeParticipantId = state.participants[0].id; state.selectedCharacterId = state.participants[0].characters[0].id; saveState(); render(); });
  byId("participant-next").addEventListener("click", () => setView("need")); byId("need-back").addEventListener("click", () => setView("participant")); byId("need-next").addEventListener("click", () => setStep("event"));
  byId("change-need").addEventListener("click", () => setView("need")); byId("return-to-participant").addEventListener("click", () => setView("participant"));
  document.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", () => setStep(button.dataset.step)));
  document.querySelectorAll("[data-go-step]").forEach((button) => button.addEventListener("click", () => setStep(button.dataset.goStep)));
  const fields = { "real-event": "realEventDescription", "counterfactual-event": "counterfactualDescription", "real-past-time": "realPastTimePoint", "real-future-time": "realFutureTimePoint", "counterfactual-past-time": "counterfactualPastTimePoint", "counterfactual-future-time": "counterfactualFutureTimePoint" };
  Object.entries(fields).forEach(([id, field]) => byId(id).addEventListener("input", (event) => updateParticipant(field, event.target.value)));
  byId("add-character").addEventListener("click", () => { const participant = getActiveParticipant(); if (participant.characters.length >= 3) return; updateActiveParticipant({ characters: [...participant.characters, createCharacter(participant.characters.length + 1)] }); render(); });
  byId("character-select").addEventListener("change", (event) => { state.selectedCharacterId = event.target.value; saveState(); renderGeneratedViews(); });
  document.querySelectorAll("[data-condition]").forEach((button) => button.addEventListener("click", () => { state.selectedCondition = button.dataset.condition; saveState(); renderGenerationControls(); renderGeneratedViews(); }));
  document.querySelectorAll("[data-time]").forEach((button) => button.addEventListener("click", () => { state.selectedTimePoint = button.dataset.time; saveState(); renderGenerationControls(); renderGeneratedViews(); }));
  byId("generate-button").addEventListener("click", async () => {
    if (!hasRequiredGenerationData() || state.isGenerating) return; state.isGenerating = true; state.generationError = ""; renderGenerationControls(); renderPostcard();
    try { upsertGeneration(await createApiGeneration()); } catch (error) { state.generationError = error.message; upsertGeneration(createMockGeneration()); }
    state.isGenerating = false; saveState(); render();
  });
}
bindStaticEvents(); render();
