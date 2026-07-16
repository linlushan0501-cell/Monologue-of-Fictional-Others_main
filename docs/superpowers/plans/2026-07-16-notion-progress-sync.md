# Notion Progress Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist and restore browser progress through a separate Notion data source.

**Architecture:** Add one Vercel progress endpoint that queries, creates, and updates one state record per device. The browser retains immediate localStorage persistence and calls the endpoint only at startup, Next actions, and successful generation.

**Tech Stack:** Browser JavaScript, Vercel Functions, Notion API, Node assertions

## Global Constraints

- Do not change UI or existing generation behavior.
- Use `NOTION_PROGRESS_DATA_SOURCE_ID`.
- Notion failures must not block the participant flow.

---

### Task 1: Progress endpoint

**Files:**
- Create: `api/progress.js`
- Create: `tests/progress-sync.test.mjs`

- [ ] Write assertions for GET/POST handling, device filtering, chunked progress data, and Notion create/update.
- [ ] Run the test and confirm it fails because the endpoint is missing.
- [ ] Implement the minimal endpoint.
- [ ] Run the test and confirm it passes.

### Task 2: Browser synchronization

**Files:**
- Modify: `script.js`
- Test: `tests/progress-sync.test.mjs`

- [ ] Write assertions for persistent device ID, startup load, Next saves, and post-generation saves.
- [ ] Run the test and confirm it fails.
- [ ] Add non-blocking load/save calls without changing rendering or UI.
- [ ] Run all existing tests and confirm they pass.
