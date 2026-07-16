const NOTION_VERSION = "2026-03-11";
const NOTION_PAGES_URL = "https://api.notion.com/v1/pages";

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function notionHeaders(notionKey) {
  return {
    Authorization: `Bearer ${notionKey}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

function notionText(value) {
  return [{ type: "text", text: { content: String(value || "").slice(0, 1900) || "-" } }];
}

function progressChunks(value) {
  return (String(value || "").match(/.{1,1900}/gs) || ["{}"]).map((content) => ({
    type: "text",
    text: { content },
  }));
}

function readProgress(page) {
  return (page?.properties?.progress_data?.rich_text || []).map((item) => item.plain_text || item.text?.content || "").join("");
}

async function resolveDataSourceId(notionKey, configuredId) {
  const response = await fetch(`https://api.notion.com/v1/databases/${configuredId}`, {
    headers: notionHeaders(notionKey),
  });
  if (!response.ok) return configuredId;
  const database = await response.json();
  return database.data_sources?.[0]?.id || configuredId;
}

async function queryProgress(notionKey, dataSourceId, deviceId) {
  const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: "POST",
    headers: notionHeaders(notionKey),
    body: JSON.stringify({
      filter: { property: "device_id", rich_text: { equals: deviceId } },
      page_size: 1,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Notion progress query failed.");
  return payload.results?.[0] || null;
}

function progressProperties(deviceId, participantId, progressData) {
  return {
    participant_id: { title: notionText(participantId || "Device progress") },
    device_id: { rich_text: notionText(deviceId) },
    progress_data: { rich_text: progressChunks(progressData) },
    updated_at: { date: { start: new Date().toISOString() } },
  };
}

async function saveProgress(notionKey, dataSourceId, deviceId, participantId, state) {
  const existing = await queryProgress(notionKey, dataSourceId, deviceId);
  const properties = progressProperties(deviceId, participantId, JSON.stringify(state));
  const url = existing ? `${NOTION_PAGES_URL}/${existing.id}` : NOTION_PAGES_URL;
  const response = await fetch(url, {
    method: existing ? "PATCH" : "POST",
    headers: notionHeaders(notionKey),
    body: JSON.stringify(existing ? { properties } : { parent: { data_source_id: dataSourceId }, properties }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Notion progress save failed.");
}

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const notionKey = process.env.NOTION_API_KEY;
    const configuredId = process.env.NOTION_PROGRESS_DATA_SOURCE_ID;
    if (!notionKey || !configuredId) throw new Error("Missing Notion progress configuration.");
    const dataSourceId = await resolveDataSourceId(notionKey, configuredId);

    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const deviceId = String(request.method === "GET" ? request.query?.device_id || "" : body.device_id || "").slice(0, 160);
    if (!deviceId) {
      sendJson(response, 400, { error: "Missing device_id." });
      return;
    }

    if (request.method === "GET") {
      const page = await queryProgress(notionKey, dataSourceId, deviceId);
      if (!page) {
        sendJson(response, 200, { state: null });
        return;
      }
      const progressData = readProgress(page);
      sendJson(response, 200, { state: JSON.parse(progressData || "{}") });
      return;
    }

    if (request.method === "POST") {
      await saveProgress(notionKey, dataSourceId, deviceId, body.participant_id, body.state || {});
      sendJson(response, 200, { saved: true });
    }
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Progress sync failed." });
  }
}
