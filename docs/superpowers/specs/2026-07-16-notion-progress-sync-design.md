# Notion Progress Sync Design

## Goal

Restore the same browser's participant list, form data, and generation progress after reopening the deployed site.

## Scope

- Keep the existing UI, generation flow, and generation-record database unchanged.
- Continue saving locally immediately.
- Save one complete browser state to a separate Notion progress database when the user presses Next or completes a generation.
- Load that state once when the site opens.
- Identify the browser with a random device ID stored in both localStorage and a persistent cookie.

## Notion schema

- `participant_id` — Title
- `device_id` — Rich text
- `progress_data` — Rich text
- `updated_at` — Date

The progress JSON is split into multiple rich-text objects so it can exceed Notion's 2,000-character per-object limit.

## Configuration

Add `NOTION_PROGRESS_DATA_SOURCE_ID` to Vercel. Existing Notion and OpenAI environment variables remain unchanged.

## Failure behavior

Local storage remains the immediate fallback. A failed Notion save or load does not block navigation or generation.
