import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const apiPath = new URL("../api/generate.js", import.meta.url);

assert.equal(existsSync(apiPath), true, "Vercel should expose an /api/generate function.");

const api = readFileSync(apiPath, "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

assert.match(api, /need_id_snapshot:\s*trimText\(body\.need_id_snapshot/, "API should accept the need id snapshot.");
assert.match(api, /need_question_snapshot:\s*trimText\(body\.need_question_snapshot/, "API should accept the need question snapshot.");
assert.match(api, /needQuestionSnapshot:\s*record\.need_question_snapshot/, "API response should return the need snapshot.");
assert.doesNotMatch(api, /`角色關係：\$\{record\.relationship/, "Prompt should not use relationship.");
assert.match(api, /imageStatus:\s*["']reserved["']/, "API response should reserve future image state.");

assert.match(api, /process\.env\.OPENAI_API_KEY/, "The API function should read the OpenAI key on the server.");
assert.match(api, /process\.env\.NOTION_API_KEY/, "The API function should read the Notion key on the server.");
assert.match(api, /process\.env\.NOTION_PARENT_PAGE_ID/, "The API function should write under the configured Notion parent page.");
assert.match(api, /process\.env\.NOTION_DATA_SOURCE_ID/, "The API function should support writing rows to a Notion data source table.");
assert.match(api, /https:\/\/api\.openai\.com\/v1\/responses/, "The API function should call OpenAI Responses API.");
assert.match(api, /https:\/\/api\.notion\.com\/v1\/pages/, "The API function should create a Notion page record.");
assert.match(api, /generated_image_url/, "The Notion record payload should include generated_image_url even when blank.");
assert.match(api, /database_id/, "The Notion table path should accept the database ID copied from the Notion table URL.");
assert.match(api, /participant_id:\s*\{\s*title:/, "The Notion table row should use participant_id as the title column.");
assert.match(api, /condition:\s*\{\s*select:/, "The Notion table row should write condition as a select.");
assert.match(api, /time_point_type:\s*\{\s*select:\s*\{\s*name:\s*timeCategoryLabel/s, "The Notion table row should write 過去/當下/未來 into time_point_type.");
assert.match(api, /time_point_label:\s*\{\s*rich_text:\s*notionRichText\(record\.time_point_label\)/, "The Notion table row should write the user's time label text into time_point_label.");
assert.match(api, /"image URL":\s*\{\s*url:/, "The Notion table row should use the configured image URL column.");
assert.match(api, /time:\s*\{\s*date:/, "The Notion table row should write time as a date column.");
assert.match(api, /prompt_version_reason:\s*\{\s*rich_text:\s*notionOptionalRichText\(record\.prompt_version_reason\)/, "The Notion table row should write the prompt version reason only when present.");
assert.match(api, /prompt_version_reason:\s*trimText\(body\.prompt_version_reason,\s*500\)/, "The API should only write a version reason when the request sends one.");
assert.doesNotMatch(api, /body\.prompt_version_reason\s*\|\|/, "The API should not repeat the version reason on every generated row by default.");
assert.match(api, /反事實不是角色本身的反事實/, "The prompt should clarify that counterfactual applies to the event scenario, not the character.");
assert.match(api, /不要直接說出時間點標籤/, "The prompt should prevent literal time-label exposition.");
assert.match(api, /不要用「如果.*」作為開頭/, "The prompt should avoid starting by reciting counterfactual settings.");
assert.match(api, /past.*present.*future/s, "The prompt should vary perspective rules by time point.");
assert.match(api, /present：當下是 2026 年現在/, "The prompt should treat present as the 2026 present, not the original event moment.");
assert.match(api, /不要把使用者輸入的敘事內文整段換句話重述/, "The prompt should prevent paraphrasing the user's source text as the monologue.");
assert.match(api, /物件、場景或日常細節可以出現，但必須有角色原因/, "The prompt should allow grounded details while preventing repeated prop templates.");
assert.match(api, /每次選擇一種不同的獨白形式/, "The prompt should require varied monologue forms instead of one repeated structure.");

assert.match(script, /fetch\("\/api\/generate"/, "The browser should call the Vercel function instead of only using mock data.");
assert.match(script, /participant_id/, "The browser should send participant_id to the API.");
assert.match(script, /time_point_type/, "The browser should send time_point_type to the API.");
assert.match(script, /prompt_version/, "The browser should send prompt_version to the API.");
assert.match(script, /prompt_version_reason/, "The browser should send the reason for the current prompt version.");
assert.match(script, /localStorage\.getItem\(promptVersionReasonKey\)/, "The browser should remember whether the current version reason has already been recorded.");
assert.match(script, /localStorage\.setItem\(promptVersionReasonKey,\s*"recorded"\)/, "The browser should mark the version reason as recorded after a successful generation.");
assert.match(script, /real_event_description/, "The browser should send the real event description for contrast.");
assert.match(script, /counterfactual_event_description/, "The browser should send the counterfactual event description for contrast.");
