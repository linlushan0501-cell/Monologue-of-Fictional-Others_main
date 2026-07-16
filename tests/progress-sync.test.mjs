import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const apiPath = new URL("../api/progress.js", import.meta.url);
assert.equal(existsSync(apiPath), true, "Vercel should expose an /api/progress function.");

const api = readFileSync(apiPath, "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

assert.match(api, /NOTION_PROGRESS_DATA_SOURCE_ID/, "Progress should use a separate Notion data source.");
assert.match(api, /\/v1\/databases\/\$\{configuredId\}/, "A database URL ID should be resolved through the Notion database endpoint.");
assert.match(api, /database\.data_sources\?\.\[0\]\?\.id/, "The first data source ID should be used for progress queries.");
assert.match(api, /resolveDataSourceId\(notionKey, configuredId\)/, "The configured ID should be resolved before reading or writing progress.");
assert.match(api, /data_sources\/.*query/, "Progress loading should query the Notion data source.");
assert.match(api, /device_id/, "Progress records should be scoped by device ID.");
assert.match(api, /progress_data/, "Progress records should store serialized browser state.");
assert.match(api, /\.match\(\/\.\{1,1900\}\/gs\)/, "Large progress JSON should be split into safe Notion chunks.");
assert.match(api, /request\.method === "GET"/, "The endpoint should load saved progress.");
assert.match(api, /request\.method === "POST"/, "The endpoint should save progress.");
assert.match(api, /PATCH/, "Existing progress records should be updated.");

assert.match(script, /const deviceIdKey/, "The browser should keep a stable device ID.");
assert.match(script, /document\.cookie/, "The device ID should have a cookie fallback.");
assert.match(script, /fetch\(`\/api\/progress\?device_id=/, "The browser should load progress at startup.");
assert.match(script, /fetch\("\/api\/progress"/, "The browser should save progress to Notion.");
assert.match(script, /participant-next.*saveProgressToCloud/s, "Participant Next should save progress.");
assert.match(script, /need-next.*saveProgressToCloud/s, "Need Next should save progress.");
assert.match(script, /upsertGeneration.*saveProgressToCloud/s, "Completed generations should save progress.");
