const STAGE_LABELS = {
  new: "新客户",
  quoted: "已报价",
  follow_up: "跟进中",
  won: "已成交",
  receivable: "待回款",
  lost: "已流失",
};

const KNOWLEDGE_CATEGORY_LABELS = {
  product: "产品资料",
  pricing: "报价规则",
  faq: "FAQ",
  contract: "合同模板",
  policy: "制度资料",
};

const PINYIN_MAP = {
  产: "chan",
  品: "pin",
  资: "zi",
  料: "liao",
  报: "bao",
  价: "jia",
  规: "gui",
  则: "ze",
  合: "he",
  同: "tong",
  模: "mo",
  板: "ban",
  售: "shou",
  后: "hou",
  问: "wen",
  答: "da",
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

export function getKnowledgeCategoryLabel(category) {
  return KNOWLEDGE_CATEGORY_LABELS[category] || "其他资料";
}

export function normalizeKnowledgeItem(input) {
  const category = normalizeText(input.category || "product");
  const title = normalizeText(input.title || "未命名资料");
  const content = normalizeText(input.content || "");
  const keywords = normalizeKeywords(input.keywords);

  return {
    id: input.id || `kb-${category}-${slugify(title)}`,
    category,
    title,
    content,
    keywords,
    updatedAt: input.updatedAt || new Date().toISOString().slice(0, 10),
  };
}

export function summarizeKnowledgeBase(items) {
  const normalizedItems = items.map(normalizeKnowledgeItem);
  const byCategory = normalizedItems.reduce((summary, item) => {
    summary[item.category] = (summary[item.category] || 0) + 1;
    return summary;
  }, {});

  return {
    total: normalizedItems.length,
    byCategory,
    categories: Object.entries(byCategory).map(([category, count]) => ({
      category,
      label: getKnowledgeCategoryLabel(category),
      count,
    })),
  };
}

export function searchKnowledge(need, items, limit = 4) {
  const normalizedNeed = normalizeText(need).toLowerCase();
  const needTerms = createSearchTerms(normalizedNeed);

  return items
    .map(normalizeKnowledgeItem)
    .map((item) => ({
      ...item,
      score: scoreKnowledgeItem(normalizedNeed, needTerms, item),
    }))
    .filter((item) => item.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return categoryPriority(first.category) - categoryPriority(second.category);
    })
    .slice(0, limit);
}

export function generateSalesAssistantDraft(need, knowledgeItems = []) {
  const normalizedNeed = need.trim();
  const budget = extractBudget(normalizedNeed);
  const matchedKnowledge = searchKnowledge(normalizedNeed, knowledgeItems);
  const productMatch = matchedKnowledge.find((item) => item.category === "product");
  const pricingMatch = matchedKnowledge.find((item) => item.category === "pricing");
  const faqMatch = matchedKnowledge.find((item) => item.category === "faq");
  const wantsWechat = normalizedNeed.includes("微信");
  const wantsQuote = normalizedNeed.includes("报价");
  const wantsInventory = normalizedNeed.includes("进销存") || normalizedNeed.includes("库存");

  const recommendedProduct =
    productMatch?.title ||
    (wantsInventory || wantsQuote
      ? "轻量进销存与报价跟进方案"
      : "AI 销售跟单经营助理标准版");

  const reasons = [
    productMatch
      ? `知识库匹配到「${productMatch.title}」，适合用企业已有产品资料来回答客户。`
      : wantsInventory
        ? "客户明确提到进销存或库存管理，需要把产品、报价和订单数据打通。"
        : "客户需求可以先从销售跟进和经营台账切入。",
    pricingMatch
      ? `报价可参考「${pricingMatch.title}」：${pricingMatch.content}`
      : wantsQuote
        ? "客户关注报价管理，适合用报价规则和跟进提醒提高销售响应速度。"
        : "报价模块可以作为后续扩展项承接销售流程。",
    faqMatch
      ? `常见问题可引用「${faqMatch.title}」，降低销售反复解释成本。`
      : wantsWechat
        ? "客户需要微信通知，后续可接企业微信或普通微信跟进话术。"
        : "通知能力可先用系统待办承接，后续再接企业微信/钉钉。",
  ];

  const quoteDescription = pricingMatch
    ? `建议按「${pricingMatch.title}」生成报价说明：${pricingMatch.content} 本次客户预算为${budget}，报价边界建议写清产品资料、销售助手、报价跟进、老板日报和试运行周期。`
    : `建议先按${budget}的试点范围报价，包含客户资料台账、产品推荐、报价说明、跟进提醒和老板日报。第一阶段以 1 个销售团队、1 套产品资料和 30 天试运行为交付边界。`;

  const wechatMessage = `您好，我根据您提到的需求和我们已有资料，建议先看「${recommendedProduct}」。这个方案可以把产品资料、报价规则和客户跟进放到一个系统里，销售能快速生成报价说明，系统也能通过微信通知提醒未跟进客户。我们可以先按${budget}做试点，跑通后再扩展库存、发票和回款管理。`;

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
    matchedKnowledge,
  };
}

function normalizeText(value) {
  return String(value).trim().replace(/\s+/g, " ");
}

function normalizeKeywords(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  return String(value || "")
    .split(/[,，、\n]/)
    .map(normalizeText)
    .filter(Boolean);
}

function scoreKnowledgeItem(need, needTerms, item) {
  const haystack = `${item.title} ${item.content} ${item.keywords.join(" ")}`.toLowerCase();
  let score = 0;

  for (const keyword of item.keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    if (need.includes(normalizedKeyword)) {
      score += 8;
    } else if (normalizedKeyword.length >= 2 && haystack.includes(normalizedKeyword)) {
      score += overlapScore(needTerms, createSearchTerms(normalizedKeyword));
    }
  }

  score += overlapScore(needTerms, createSearchTerms(haystack));

  if (item.category === "product" && /产品|方案|系统|进销存|报价/.test(need)) {
    score += 2;
  }

  if (item.category === "pricing" && /预算|报价|费用|价格|万/.test(need)) {
    score += 2;
  }

  if (item.category === "faq" && /支持|能否|可以|微信|通知|提醒/.test(need)) {
    score += 2;
  }

  return score;
}

function createSearchTerms(value) {
  const terms = new Set();
  const normalized = value.toLowerCase();

  for (const token of normalized.split(/[\s,，、。；;：:（）()]+/)) {
    if (token.length >= 2) {
      terms.add(token);
    }
  }

  for (let index = 0; index < normalized.length - 1; index += 1) {
    const bigram = normalized.slice(index, index + 2);
    if (/[\u4e00-\u9fa5]{2}/.test(bigram)) {
      terms.add(bigram);
    }
  }

  return terms;
}

function overlapScore(firstTerms, secondTerms) {
  let score = 0;

  for (const term of firstTerms) {
    if (secondTerms.has(term)) {
      score += term.length >= 3 ? 2 : 1;
    }
  }

  return score;
}

function categoryPriority(category) {
  return ["product", "pricing", "faq", "contract", "policy"].indexOf(category);
}

function slugify(value) {
  const parts = [];
  let asciiBuffer = "";

  for (const char of normalizeText(value).toLowerCase()) {
    if (/[a-z0-9]/.test(char)) {
      asciiBuffer += char;
      continue;
    }

    if (asciiBuffer) {
      parts.push(asciiBuffer);
      asciiBuffer = "";
    }

    if (PINYIN_MAP[char]) {
      parts.push(PINYIN_MAP[char]);
    }
  }

  if (asciiBuffer) {
    parts.push(asciiBuffer);
  }

  return parts.join("-") || "item";
}

function extractBudget(need) {
  const budgetMatch = need.match(/预算\s*([0-9.]+\s*万以内|[0-9.]+\s*万元以内|[0-9.]+\s*万)/);
  if (budgetMatch) {
    return budgetMatch[1].replace("万元", "万");
  }

  return "3 万以内";
}
