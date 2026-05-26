# AI Business Assistant Phase 2 Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a phase-two enterprise knowledge base so sales recommendations can reference product资料、报价规则、FAQ、合同模板.

**Architecture:** Keep the MVP as a single Next.js app. Add pure knowledge-base logic under `src/lib/business.js`, seed data under `src/lib/mock-data.js`, API routes under `src/app/api`, and a knowledge panel in the existing home page.

**Tech Stack:** Next.js API Routes, React state, local mock data, Node.js `node:test`.

---

## File Structure

- `src/lib/business.js`: add `normalizeKnowledgeItem`, `summarizeKnowledgeBase`, and `searchKnowledge`; update `generateSalesAssistantDraft` to accept matched knowledge.
- `src/lib/mock-data.js`: add `mockKnowledgeItems`.
- `src/app/api/knowledge/route.js`: return and validate knowledge entries.
- `src/app/api/assistant/route.js`: accept optional `knowledgeItems` in the POST body.
- `src/app/page.jsx`: load knowledge items, show knowledge stats, allow local entry creation, and pass knowledge to the sales assistant.
- `src/app/globals.css`: style knowledge controls and matched-reference blocks.
- `tests/business.test.mjs`: cover knowledge normalization, search, summary, and sales generation using knowledge.

## Tasks

### Task 1: Knowledge Logic Tests

**Files:**
- Modify: `tests/business.test.mjs`

- [ ] **Step 1: Add failing tests for knowledge summary, search, normalization, and sales-assistant grounding.**

The tests must prove that:

- Knowledge entries are grouped by category.
- Customer需求 can match product/quote/FAQ knowledge.
- New knowledge entries get a stable id and trimmed fields.
- `generateSalesAssistantDraft(need, knowledgeItems)` prefers matched knowledge over generic recommendations.

### Task 2: Knowledge Logic Implementation

**Files:**
- Modify: `src/lib/business.js`
- Modify: `src/lib/mock-data.js`

- [ ] **Step 1: Implement `normalizeKnowledgeItem`, `summarizeKnowledgeBase`, and `searchKnowledge`.**

Use deterministic keyword scoring. No LLM is required in phase two.

- [ ] **Step 2: Update `generateSalesAssistantDraft` to accept `knowledgeItems = []`.**

The result must include `matchedKnowledge` and use the best matched product as the recommendation when available.

- [ ] **Step 3: Add seed knowledge for product资料、报价规则、FAQ、合同模板.**

### Task 3: Knowledge API

**Files:**
- Create: `src/app/api/knowledge/route.js`
- Modify: `src/app/api/assistant/route.js`

- [ ] **Step 1: Add `GET /api/knowledge`.**

Return seeded knowledge items plus summary.

- [ ] **Step 2: Add `POST /api/knowledge`.**

Validate and normalize a submitted knowledge item, then return it. Persistence remains client-side for this MVP stage.

- [ ] **Step 3: Update assistant route.**

Accept optional `knowledgeItems` and pass them to `generateSalesAssistantDraft`.

### Task 4: Knowledge UI

**Files:**
- Modify: `src/app/page.jsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Load knowledge data with dashboard and customers.**

- [ ] **Step 2: Add a knowledge-base panel.**

Show category counts, entry list, and a compact form for title/category/content/keywords.

- [ ] **Step 3: Pass current knowledge entries to the assistant.**

Show matched knowledge references in the generated result.

### Task 5: Verification

**Files:**
- Modify: none

- [ ] **Step 1: Run `npm.cmd test`.**

Expected: all tests pass.

- [ ] **Step 2: Run `npm.cmd run build` with dev server stopped.**

Expected: production build passes.

- [ ] **Step 3: Restart dev server with `npm.cmd run dev`.**

Expected: `http://localhost:3000` returns 200 and displays the app.
