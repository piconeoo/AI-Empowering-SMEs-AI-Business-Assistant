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
