const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const NOTION_PAGES_URL = "https://api.notion.com/v1/pages";
const NOTION_VERSION = "2026-03-11";
const PROMPT_VERSION = "openai-notion-v4";

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function trimText(value, maxLength = 1900) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function limitGeneratedText(value, maxLength = 450) {
  return String(value || "").trim().slice(0, maxLength);
}

function notionRichText(value) {
  return [{ type: "text", text: { content: trimText(value) || "-" } }];
}

function notionOptionalRichText(value) {
  const text = trimText(value);
  return text ? [{ type: "text", text: { content: text } }] : [];
}

function notionTitle(value) {
  return [{ type: "text", text: { content: trimText(value, 240) || "Generated record" } }];
}

function getConditionLabel(condition) {
  return condition === "counterfactual" ? "反事實" : "真實";
}

function getTimePointLabel(timePointType, condition) {
  if (timePointType === "present") return condition === "real" ? "現在" : "當下";
  const labels = {
    past: "過去",
    future: "未來",
  };
  return labels[timePointType] || timePointType;
}

function extractOpenAiText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = payload.output?.flatMap((item) => item.content || []) || [];
  const text = parts
    .map((part) => part.text || part.output_text || "")
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || "生成完成，但 OpenAI 回應沒有可讀文字。";
}

function buildPrompt(record) {
  const conditionLabel = getConditionLabel(record.condition);
  const timeLabel = record.time_point_type === "present" ? "當下" : record.time_point_label;
  const selectedScenario =
    record.condition === "counterfactual"
      ? record.counterfactual_event_description || record.event_description
      : record.real_event_description || record.event_description;
  const contrastScenario =
    record.condition === "counterfactual" ? record.real_event_description : record.counterfactual_event_description;
  const timePointGuidance = {
    past: "past：把時間點當成角色當時所在的場景。寫出那時已經能看見的細節、預感、關係張力；不要用回顧報告腔。",
    present: "present：當下是 2026 年現在，不是原始事件發生當下。真實當下是 2026 現在的真實情境；反事實當下是 2026 現在的反事實情境。",
    future: "future：把未來時間點當成已經抵達的生活現場。寫後來留下的痕跡與關係變化；不要寫「到了某年」或預測句。",
  };

  return [
    "任務：生成一段繁體中文的第一人稱虛構他者獨白。",
    "敘事者是「角色」本人，不是研究者，也不是參與者。角色要從自己的關係位置、有限知情範圍、價值判斷、語氣和盲點出發。",
    "角色沒有看過、聽過或收到參與者輸入的文字。輸入故事只供你理解背景，不是參與者傳給角色的訊息。",
    "不得引用、回覆、複誦或評論參與者的原句，也不得寫成角色剛聽完故事後給參與者的回應。",
    "反事實不是角色本身的反事實；反事實只代表「關鍵事件情境」改成使用者輸入的反事實版本。角色仍然是同一個敘事視角。",
    "真實條件只根據真實關鍵事件；反事實條件只根據反事實關鍵事件。不要把兩個情境混成角色自己的如果人生。",
    "",
    "時間處理：",
    timePointGuidance.past,
    timePointGuidance.present,
    timePointGuidance.future,
    `本次要使用的時間類型：${record.time_point_type}`,
    `本次時間點標籤：${timeLabel}`,
    "不要直接說出時間點標籤；把它轉成場景裡自然存在的痕跡、身體感、日常細節或關係變化。",
    "",
    "語氣與結構限制：",
    "不要用「如果...」作為開頭，也不要用「我想，到了...」「在某年...」「假如我是...」這種把設定念出來的句子。",
    "第一句直接進入角色此刻的注意、念頭、動作、感官或尚未說出口的判斷；不要交代自己正在回應一段敘述。",
    "全篇維持角色本人的第一人稱視角；第一人稱視角不等於每句或第一句都要以「我」開頭。",
    "不要說明你正在使用真實、反事實、過去、當下、未來這些欄位。",
    "不要每次都用同一種句型。依角色關係調整距離感：親密角色可以有遲疑、責備、心疼；較遠角色可以有克制、旁觀、誤解。",
    "避免研究摘要、診斷、人生建議、道德評判。不要把症狀或團體反應講成通用模板。",
    "直接進入第一人稱現場，可以稱呼參與者為「你」，但要符合角色關係。",
    "不要把使用者輸入的敘事內文整段換句話重述；事件只能形成角色所處的背景與壓力，不可成為逐句改寫素材。",
    "獨白必須呈現角色自己的觀點：他如何理解或誤解局面、想維護什麼、害怕失去什麼、對參與者抱持何種矛盾，以及哪些話只敢留在心裡。",
    "讓觀點逐層推進：從表層注意或判斷，走向關係中的拉扯、自我辯護或盲點，再抵達角色仍無法完全說清楚的核心。不要整理成事件摘要。",
    "物件、場景或日常細節可以出現，但必須有角色原因：它能暴露職務、關係、時間狀態或情緒防衛。不要反覆使用咖啡、桌子、紙箱、滑鼠、冷掉等可替換道具模板。",
    "每次選擇一種不同的獨白形式，例如壓抑短句、碎念式辯解、很冷靜的交代、突然漏出的責備、沒說出口的告白、命令式自我控制、記憶片段拼接。形式要貼合角色，不要在文中說明你選了哪一種。",
    "句子長短、停頓、稱呼方式和情緒外露程度要隨角色改變；不要每段都用「我把...」「其實我...」「我只是...」「我怕...」的固定推進。",
    "",
    "本次生成資料：",
    `參與者代號：${record.participant_id}`,
    `條件：${conditionLabel}`,
    `角色：${record.character}`,
    `選角理由：${record.selection_reason || "-"}`,
    `事件探索方向：${record.need_label_snapshot || "-"}`,
    `引導題目：${record.need_question_snapshot || "-"}`,
    "探索方向只用來決定獨白的注意重點，不得因此補充事件中沒有提供的事實。",
    `本次應採用的事件情境：${selectedScenario}`,
    `另一個情境僅供區分，不可混用：${contrastScenario || "-"}`,
    "",
    "輸出限制：只輸出獨白正文，控制在 400 至 450 個繁體中文字（包含標點）。不要加標題、括號註解、欄位名稱或條列。",
  ].join("\n");
}

function buildExpansionPrompt(record, draft) {
  return [
    buildPrompt(record),
    "",
    "以下初稿不足 400 字。請重寫並擴充到 400 至 450 字，而不是在末尾機械補句。",
    "保留角色第一人稱視角與原有情緒方向，增加角色自己的判斷、矛盾、盲點和關係層次；仍不得複誦或回覆參與者的輸入。",
    `初稿：${draft}`,
  ].join("\n");
}

async function requestOpenAiText(openAiKey, prompt) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5.5",
      input: prompt,
      max_output_tokens: 1400,
    }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "OpenAI generation failed.");
  return extractOpenAiText(payload);
}

async function createOpenAiText(record) {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  let generatedText = await requestOpenAiText(openAiKey, buildPrompt(record));
  if (generatedText.length < 400) {
    generatedText = await requestOpenAiText(openAiKey, buildExpansionPrompt(record, generatedText));
  }
  return limitGeneratedText(generatedText);
}

async function createNotionPage(record) {
  const notionKey = process.env.NOTION_API_KEY;
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

  if (!notionKey) {
    throw new Error("Missing NOTION_API_KEY.");
  }

  if (dataSourceId) {
    return createNotionTableRow(record, notionKey, dataSourceId);
  }

  if (!parentPageId) {
    throw new Error("Missing NOTION_DATA_SOURCE_ID or NOTION_PARENT_PAGE_ID.");
  }

  const title = `${record.participant_id} / ${record.condition} / ${record.time_point_type} / ${record.character}`;
  const fields = [
    ["participant_id", record.participant_id],
    ["condition", record.condition],
    ["time_point_type", record.time_point_type],
    ["time_point_label", record.time_point_label],
    ["character", record.character],
    ["prompt_version", record.prompt_version],
    ["prompt_version_reason", record.prompt_version_reason],
    ["generated_text", record.generated_text],
    ["timestamp", record.timestamp],
  ];

  const response = await fetch(NOTION_PAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionKey}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: {
        title: notionTitle(title),
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: notionRichText("Generated Record") },
        },
        ...fields.map(([label, value]) => ({
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: notionRichText(`${label}: ${value || ""}`) },
        })),
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Notion page creation failed.");
  }

  return payload.url || "";
}

async function createNotionTableRow(record, notionKey, databaseId) {
  const conditionLabel = getConditionLabel(record.condition);
  const timeCategoryLabel = getTimePointLabel(record.time_point_type, record.condition);
  const properties = {
    participant_id: { title: notionTitle(record.participant_id) },
    event_type: { select: { name: record.need_label_snapshot } },
    condition: { select: { name: conditionLabel } },
    time_point_type: { select: { name: timeCategoryLabel } },
    time_point_label: { rich_text: notionRichText(record.time_point_label) },
    character: { rich_text: notionRichText(record.character) },
    generated_text: { rich_text: notionRichText(record.generated_text) },
    time: { date: { start: record.timestamp } },
    prompt_version: { rich_text: notionRichText(record.prompt_version) },
    prompt_version_reason: { rich_text: notionOptionalRichText(record.prompt_version_reason) },
  };

  const response = await fetch(NOTION_PAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionKey}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Notion table row creation failed.");
  }

  return payload.url || "";
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const record = {
      participant_id: trimText(body.participant_id, 120),
      condition: trimText(body.condition, 80),
      time_point_type: trimText(body.time_point_type, 80),
      time_point_label: trimText(body.time_point_label, 240),
      character: trimText(body.character, 160),
      selection_reason: trimText(body.selection_reason, 500),
      need_id_snapshot: trimText(body.need_id_snapshot, 120),
      need_label_snapshot: trimText(body.need_label_snapshot, 160),
      need_question_snapshot: trimText(body.need_question_snapshot, 600),
      event_description: trimText(body.event_description, 1600),
      real_event_description: trimText(body.real_event_description, 1600),
      counterfactual_event_description: trimText(body.counterfactual_event_description, 1600),
      prompt_version: body.prompt_version || PROMPT_VERSION,
      prompt_version_reason: trimText(body.prompt_version_reason, 500),
      timestamp: new Date().toISOString(),
    };

    if (!record.participant_id || !record.condition || !record.time_point_type || !record.character || !record.event_description) {
      sendJson(response, 400, { error: "Missing required generation fields." });
      return;
    }

    const generatedText = await createOpenAiText(record);
    const completedRecord = {
      ...record,
      generated_text: generatedText,
    };
    const notion_url = await createNotionPage(completedRecord);

    sendJson(response, 200, {
      generation: {
        id: body.id,
        participantId: body.participantId,
        participantCode: record.participant_id,
        characterId: body.character_id,
        characterName: record.character,
        relationship: record.relationship,
        selectionReason: record.selection_reason,
        needIdSnapshot: record.need_id_snapshot,
        needLabelSnapshot: record.need_label_snapshot,
        needQuestionSnapshot: record.need_question_snapshot,
        condition: record.condition,
        timePointType: record.time_point_type,
        timePointValue: record.time_point_label,
        generatedContent: generatedText,
        source: "api",
        generationTimestamp: record.timestamp,
        promptVersion: record.prompt_version,
        promptVersionReason: record.prompt_version_reason,
        notionUrl: notion_url,
      },
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Generation failed." });
  }
}
