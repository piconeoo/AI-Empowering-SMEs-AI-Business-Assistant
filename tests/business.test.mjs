import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomerPipeline,
  generateSalesAssistantDraft,
  normalizeKnowledgeItem,
  searchKnowledge,
  summarizeDashboard,
  summarizeKnowledgeBase,
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

const knowledgeItems = [
  {
    id: "k1",
    category: "product",
    title: "轻量进销存与报价跟进方案",
    content: "适合小型工厂，包含产品资料、库存台账、报价管理、客户跟进和微信通知。",
    keywords: ["小型工厂", "进销存", "报价管理", "微信通知"],
  },
  {
    id: "k2",
    category: "pricing",
    title: "3 万以内试点报价规则",
    content: "预算 3 万以内时，建议交付知识库、销售助手、报价跟进和老板日报。",
    keywords: ["3 万以内", "试点", "报价规则"],
  },
  {
    id: "k3",
    category: "faq",
    title: "是否支持企业微信提醒",
    content: "第一阶段支持通过企业微信或钉钉机器人发送未跟进和回款提醒。",
    keywords: ["企业微信", "钉钉", "提醒"],
  },
];

test("summarizeKnowledgeBase counts entries by category", () => {
  const summary = summarizeKnowledgeBase(knowledgeItems);

  assert.equal(summary.total, 3);
  assert.equal(summary.byCategory.product, 1);
  assert.equal(summary.byCategory.pricing, 1);
  assert.equal(summary.byCategory.faq, 1);
});

test("searchKnowledge returns the best matching product and pricing entries", () => {
  const matches = searchKnowledge(
    "小型工厂需要进销存、报价管理、微信通知，预算 3 万以内",
    knowledgeItems
  );

  assert.equal(matches[0].title, "轻量进销存与报价跟进方案");
  assert.ok(matches.some((item) => item.category === "pricing"));
});

test("normalizeKnowledgeItem trims fields and creates a stable id", () => {
  const item = normalizeKnowledgeItem({
    category: " product ",
    title: "  产品资料  ",
    content: "  支持报价和客户跟进  ",
    keywords: "报价, 客户跟进",
  });

  assert.equal(item.id, "kb-product-chan-pin-zi-liao");
  assert.equal(item.category, "product");
  assert.equal(item.title, "产品资料");
  assert.deepEqual(item.keywords, ["报价", "客户跟进"]);
});

test("generateSalesAssistantDraft uses matched knowledge when available", () => {
  const result = generateSalesAssistantDraft(
    "小型工厂需要进销存、报价管理、微信通知，预算 3 万以内",
    knowledgeItems
  );

  assert.equal(result.recommendedProduct, "轻量进销存与报价跟进方案");
  assert.match(result.quoteDescription, /3 万以内试点报价规则/);
  assert.ok(result.matchedKnowledge.some((item) => item.title === "是否支持企业微信提醒"));
});
