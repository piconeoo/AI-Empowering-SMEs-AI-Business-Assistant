# AI Business Assistant Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable Web MVP for the SME AI business assistant with dashboard, customer management, and an AI sales assistant using local mock data.

**Architecture:** Use a single Next.js App Router project for the phase-one UI and API routes. Keep business logic in small modules under `src/lib` so it can be tested with Node's built-in test runner and later moved behind a FastAPI service.

**Tech Stack:** Next.js, React, CSS, Node.js built-in `node:test`, local mock data.

---

## File Structure

- `package.json`: npm scripts and runtime dependencies.
- `next.config.mjs`: Next.js configuration.
- `jsconfig.json`: path aliases for app imports.
- `src/app/layout.jsx`: root layout and metadata.
- `src/app/page.jsx`: dashboard, customer table, and sales assistant UI.
- `src/app/api/dashboard/route.js`: dashboard summary endpoint.
- `src/app/api/customers/route.js`: customer list endpoint.
- `src/app/api/assistant/route.js`: sales assistant generation endpoint.
- `src/app/globals.css`: application styling.
- `src/lib/mock-data.js`: local seed data.
- `src/lib/business.js`: pure business logic for summaries and AI-assistant draft generation.
- `tests/business.test.mjs`: behavior tests for `src/lib/business.js`.

## Tasks

### Task 1: Add Business Logic Tests

**Files:**
- Create: `tests/business.test.mjs`

- [ ] **Step 1: Write failing tests for dashboard summary, pipeline grouping, and sales assistant generation.**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomerPipeline,
  generateSalesAssistantDraft,
  summarizeDashboard,
} from "../src/lib/business.js";

const customers = [
  {
    id: "c1",
    name: "华东机电",
    stage: "new",
    quotedAmount: 32000,
    dealAmount: 0,
    receivableAmount: 0,
    risk: "报价后 2 天未跟进",
  },
  {
    id: "c2",
    name: "星河建材",
    stage: "won",
    quotedAmount: 58000,
    dealAmount: 58000,
    receivableAmount: 18000,
    risk: "",
  },
];

test("summarizeDashboard returns operating metrics and alerts", () => {
  const summary = summarizeDashboard(customers);

  assert.equal(summary.newCustomers, 1);
  assert.equal(summary.quoteCount, 2);
  assert.equal(summary.dealCount, 1);
  assert.equal(summary.receivableTotal, 18000);
  assert.equal(summary.pendingFollowUps, 1);
  assert.deepEqual(summary.alerts, ["华东机电：报价后 2 天未跟进"]);
});

test("buildCustomerPipeline groups customers by current sales stage", () => {
  const pipeline = buildCustomerPipeline(customers);

  assert.equal(pipeline.new.length, 1);
  assert.equal(pipeline.won.length, 1);
  assert.equal(pipeline.new[0].name, "华东机电");
});

test("generateSalesAssistantDraft creates sales-ready copy from a customer need", () => {
  const result = generateSalesAssistantDraft(
    "客户要适合小型工厂的进销存系统，预算 3 万以内，需要微信通知和报价管理"
  );

  assert.equal(result.recommendedProduct, "轻量进销存与报价跟进方案");
  assert.match(result.quoteDescription, /3 万以内/);
  assert.match(result.wechatMessage, /微信通知/);
  assert.ok(result.nextActions.includes("确认客户现有产品目录和报价规则"));
});
```

- [ ] **Step 2: Run tests and verify they fail because `src/lib/business.js` does not exist.**

Run: `node --test tests/business.test.mjs`

Expected: FAIL with module not found for `src/lib/business.js`.

### Task 2: Implement Business Logic and Mock Data

**Files:**
- Create: `src/lib/business.js`
- Create: `src/lib/mock-data.js`

- [ ] **Step 1: Implement `summarizeDashboard`, `buildCustomerPipeline`, and `generateSalesAssistantDraft`.**

The functions must calculate operating metrics from customer records and generate deterministic sales copy for phase-one demos.

- [ ] **Step 2: Add mock customer data that exercises new leads, quoted customers, won customers, receivables, and risk alerts.**

The mock data must include at least five customer records and one list of dashboard action items.

- [ ] **Step 3: Run tests and verify they pass.**

Run: `node --test tests/business.test.mjs`

Expected: PASS with 3 passing tests.

### Task 3: Add Next.js App Shell and API Routes

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `jsconfig.json`
- Create: `src/app/layout.jsx`
- Create: `src/app/api/dashboard/route.js`
- Create: `src/app/api/customers/route.js`
- Create: `src/app/api/assistant/route.js`

- [ ] **Step 1: Add npm scripts for development, build, start, and tests.**

Scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "node --test tests/*.test.mjs"
}
```

- [ ] **Step 2: Add API routes.**

The dashboard route must return `summarizeDashboard(mockCustomers)`.

The customers route must return `mockCustomers`.

The assistant route must accept JSON `{ "need": "..." }`, validate that `need` has at least 8 characters, and return `generateSalesAssistantDraft(need)`.

### Task 4: Build Phase-One UI

**Files:**
- Create: `src/app/page.jsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Build the page with dashboard cards, action items, customer table, and sales assistant form.**

The page must load dashboard and customer data from API routes and submit sales needs to `/api/assistant`.

- [ ] **Step 2: Add responsive CSS.**

The layout must be usable on desktop and mobile, with dense but readable business-tool styling.

### Task 5: Verify Phase One

**Files:**
- Modify: none

- [ ] **Step 1: Install dependencies.**

Run: `npm.cmd install`

Expected: dependencies install and `package-lock.json` is generated.

- [ ] **Step 2: Run tests.**

Run: `npm.cmd test`

Expected: all tests pass.

- [ ] **Step 3: Run production build.**

Run: `npm.cmd run build`

Expected: Next.js build completes successfully.

- [ ] **Step 4: Start dev server.**

Run: `npm.cmd run dev`

Expected: local app is available at `http://localhost:3000`.
