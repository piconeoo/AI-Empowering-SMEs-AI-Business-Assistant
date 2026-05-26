const STAGE_LABELS = {
  new: "新客户",
  quoted: "已报价",
  follow_up: "跟进中",
  won: "已成交",
  receivable: "待回款",
  lost: "已流失",
};

export function summarizeDashboard(customers, actionItems = []) {
  const newCustomers = customers.filter((customer) => customer.stage === "new").length;
  const quoteCount = customers.filter((customer) => customer.quotedAmount > 0).length;
  const dealCount = customers.filter(
    (customer) => customer.stage === "won" || customer.dealAmount > 0
  ).length;
  const receivableTotal = customers.reduce(
    (total, customer) => total + (customer.receivableAmount || 0),
    0
  );
  const pendingFollowUps = customers.filter(
    (customer) =>
      customer.stage !== "won" &&
      customer.stage !== "lost" &&
      typeof customer.risk === "string" &&
      customer.risk.includes("未跟进")
  ).length;
  const alerts = customers
    .filter((customer) => customer.risk && customer.risk.trim().length > 0)
    .map((customer) => `${customer.name}：${customer.risk}`);

  return {
    newCustomers,
    quoteCount,
    dealCount,
    receivableTotal,
    pendingFollowUps,
    alerts,
    actionItems,
  };
}

export function buildCustomerPipeline(customers) {
  return Object.keys(STAGE_LABELS).reduce((pipeline, stage) => {
    pipeline[stage] = customers.filter((customer) => customer.stage === stage);
    return pipeline;
  }, {});
}

export function getStageLabel(stage) {
  return STAGE_LABELS[stage] || "未知阶段";
}

export function generateSalesAssistantDraft(need) {
  const normalizedNeed = need.trim();
  const budget = extractBudget(normalizedNeed);
  const wantsWechat = normalizedNeed.includes("微信");
  const wantsQuote = normalizedNeed.includes("报价");
  const wantsInventory = normalizedNeed.includes("进销存") || normalizedNeed.includes("库存");

  const recommendedProduct =
    wantsInventory || wantsQuote
      ? "轻量进销存与报价跟进方案"
      : "AI 销售跟单经营助理标准版";

  const reasons = [
    wantsInventory ? "客户明确提到进销存或库存管理，需要把产品、报价和订单数据打通。" : "客户需求可以先从销售跟进和经营台账切入。",
    wantsQuote ? "客户关注报价管理，适合用报价规则和跟进提醒提高销售响应速度。" : "报价模块可以作为后续扩展项承接销售流程。",
    wantsWechat ? "客户需要微信通知，后续可接企业微信或普通微信跟进话术。" : "通知能力可先用系统待办承接，后续再接企业微信/钉钉。",
  ];

  const quoteDescription = `建议先按${budget}的试点范围报价，包含客户资料台账、产品推荐、报价说明、跟进提醒和老板日报。第一阶段以 1 个销售团队、1 套产品资料和 30 天试运行为交付边界。`;

  const wechatMessage = `您好，我根据您提到的需求整理了一版轻量方案：先把产品资料、报价规则和客户跟进放到一个系统里，销售可以快速生成报价说明，系统也能通过微信通知提醒未跟进客户。我们可以先按${budget}做一个试点版本，跑通后再扩展库存、发票和回款管理。`;

  return {
    recommendedProduct,
    reasons,
    quoteDescription,
    wechatMessage,
    followUpSummary: `客户需求：${normalizedNeed}。建议优先确认产品目录、报价规则、销售人数、当前客户跟进方式和是否需要企业微信通知。`,
    nextActions: [
      "确认客户现有产品目录和报价规则",
      "确认销售团队人数和客户跟进频率",
      wantsWechat ? "确认企业微信或钉钉通知接入方式" : "确认是否需要消息通知",
      "约定试点周期和验收指标",
    ],
  };
}

function extractBudget(need) {
  const budgetMatch = need.match(/预算\s*([0-9.]+\s*万以内|[0-9.]+\s*万元以内|[0-9.]+\s*万)/);
  if (budgetMatch) {
    return budgetMatch[1].replace("万元", "万");
  }

  return "3 万以内";
}
