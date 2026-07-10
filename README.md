# Research Monologue Dashboard

研究者端靜態網頁工具，以純 HTML/CSS/JavaScript 與 Vercel Function 提供 Threads 風格的引導流程、OpenAI 文字生成與 Notion 紀錄。

## 使用方式

直接用瀏覽器打開 `index.html`。

也可以用任何靜態伺服器預覽，例如：

```bash
python3 -m http.server 3000
```

然後打開 `http://localhost:3000`。

## 操作流程

1. 建立或選擇參與者。
2. 從五個生命需求提示中選擇關鍵事件方向；之後可返回重選。
3. 填寫真實事件、反事實情境與各自的過去／未來時間點。
4. 設定 2–3 位他者（名稱與選擇原因）。
5. 每次選擇一位他者、一個條件與一個時間點，生成一筆文字。
6. 從最多 18 格的進度矩陣切換與查看既有紀錄。

資料會保存在 `localStorage`。每筆生成會保存當時的需求提示快照，因此後續重選不會改動舊紀錄。

## 圖片功能

生成結果中已預留圖片容器與資料欄位，但這一版不會呼叫圖片生成 API，`OPENAI_IMAGE_MODEL` 也不會產生使用費用。後續可沿用 `generatedImageUrl` 與 `imageStatus` 接入圖片服務。

## OpenAI / Notion API 串接

這版透過 Vercel Function 呼叫 OpenAI 與 Notion。OpenAI 或 Notion API key 不會放在前端，必須設定在 Vercel 的 Environment Variables。

必要環境變數：

```bash
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-5.5
OPENAI_IMAGE_MODEL=gpt-image-2
NOTION_API_KEY=
NOTION_PARENT_PAGE_ID=
NOTION_DATA_SOURCE_ID=
```

`NOTION_DATA_SOURCE_ID` 是 Notion 資料表 / database 的 ID，也就是表格網址中 `?v=` 前面的 32 碼。設定後，每次生成會寫成資料表的一列。若沒有設定，才會退回到 `NOTION_PARENT_PAGE_ID` 底下建立一般 Notion page。

Notion 資料表欄位需包含：

```txt
participant_id        title
condition             select: 真實, 反事實
time_point_type       select: 過去, 當下, 未來
time_point_label      text: 使用者設定的時間文字；當下固定寫當下
character             text
generated_text        text
image                 files and media
image URL             url
time                  date
prompt_version        text
prompt_version_reason text
```

生成流程：

1. 前端呼叫 `/api/generate`。
2. Vercel Function 組 prompt 並呼叫 OpenAI Responses API。
3. 生成完成後，優先寫入 `NOTION_DATA_SOURCE_ID` 指定的 Notion 表格。
4. 前端收到結果並更新 localStorage 與生成紀錄。

## Vercel

把 repository 匯入 Vercel 後，先在 Project Settings 設定上述環境變數，再 redeploy。更新程式後，commit 並 push 到 GitHub，Vercel 會自動重新部署最新 commit。
