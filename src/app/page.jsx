"use client";

import { useEffect, useMemo, useState } from "react";

const metricLabels = [
  ["newCustomers", "新客户"],
  ["quoteCount", "报价数"],
  ["dealCount", "成交订单"],
  ["receivableTotal", "待回款"],
  ["pendingFollowUps", "待跟进"],
];

const stageLabels = {
  new: "新客户",
  quoted: "已报价",
  follow_up: "跟进中",
  won: "已成交",
  receivable: "待回款",
  lost: "已流失",
};

const knowledgeCategoryLabels = {
  product: "产品资料",
  pricing: "报价规则",
  faq: "FAQ",
  contract: "合同模板",
  policy: "制度资料",
};

const sampleNeed =
  "客户要适合小型工厂的进销存系统，预算 3 万以内，需要微信通知和报价管理。";

const emptyKnowledgeForm = {
  category: "product",
  title: "",
  content: "",
  keywords: "",
};

export default function HomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [need, setNeed] = useState(sampleNeed);
  const [assistantResult, setAssistantResult] = useState(null);
  const [knowledgeForm, setKnowledgeForm] = useState(emptyKnowledgeForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const [dashboardResponse, customersResponse, knowledgeResponse] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/customers"),
        fetch("/api/knowledge"),
      ]);

      if (!dashboardResponse.ok || !customersResponse.ok || !knowledgeResponse.ok) {
        setError("经营数据加载失败。");
        return;
      }

      const knowledgePayload = await knowledgeResponse.json();
      setDashboard(await dashboardResponse.json());
      setCustomers(await customersResponse.json());
      setKnowledgeItems(knowledgePayload.items || []);
    }

    loadData();
  }, []);

  const topCustomers = useMemo(
    () =>
      [...customers]
        .filter((customer) => customer.quotedAmount > 0)
        .sort((first, second) => second.quotedAmount - first.quotedAmount)
        .slice(0, 4),
    [customers]
  );

  const knowledgeSummary = useMemo(() => {
    const byCategory = knowledgeItems.reduce((summary, item) => {
      summary[item.category] = (summary[item.category] || 0) + 1;
      return summary;
    }, {});

    return {
      total: knowledgeItems.length,
      byCategory,
    };
  }, [knowledgeItems]);

  async function handleGenerate(event) {
    event.preventDefault();
    setIsGenerating(true);
    setError("");

    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ need, knowledgeItems }),
    });

    const result = await response.json();
    setIsGenerating(false);

    if (!response.ok) {
      setAssistantResult(null);
      setError(result.message || "销售助手生成失败。");
      return;
    }

    setAssistantResult(result);
  }

  async function handleAddKnowledge(event) {
    event.preventDefault();
    setIsSavingKnowledge(true);
    setError("");

    const response = await fetch("/api/knowledge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(knowledgeForm),
    });

    const result = await response.json();
    setIsSavingKnowledge(false);

    if (!response.ok) {
      setError(result.message || "资料保存失败。");
      return;
    }

    setKnowledgeItems((items) => [result, ...items.filter((item) => item.id !== result.id)]);
    setKnowledgeForm(emptyKnowledgeForm);
  }

  function updateKnowledgeField(field, value) {
    setKnowledgeForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Web MVP · 第二阶段</p>
          <h1>中小企业 AI 经营助理</h1>
        </div>
        <div className="status-pill">知识库增强</div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="metrics-grid" aria-label="经营指标">
        {metricLabels.map(([key, label]) => (
          <article className="metric-card" key={key}>
            <span>{label}</span>
            <strong>{formatMetric(key, dashboard?.[key])}</strong>
          </article>
        ))}
      </section>

      <section className="workspace-grid">
        <div className="panel action-panel">
          <div className="panel-heading">
            <h2>今日重点</h2>
            <span>{dashboard?.actionItems?.length || 0} 项</span>
          </div>
          <ul className="action-list">
            {(dashboard?.actionItems || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="panel alert-panel">
          <div className="panel-heading">
            <h2>异常提醒</h2>
            <span>{dashboard?.alerts?.length || 0} 条</span>
          </div>
          <ul className="alert-list">
            {(dashboard?.alerts || []).map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="knowledge-section">
        <div className="panel knowledge-panel">
          <div className="panel-heading">
            <h2>企业知识库</h2>
            <span>{knowledgeSummary.total} 条资料</span>
          </div>
          <div className="knowledge-stats">
            {Object.entries(knowledgeCategoryLabels).map(([category, label]) => (
              <div className="knowledge-stat" key={category}>
                <span>{label}</span>
                <strong>{knowledgeSummary.byCategory[category] || 0}</strong>
              </div>
            ))}
          </div>
          <div className="knowledge-list">
            {knowledgeItems.slice(0, 5).map((item) => (
              <article className="knowledge-item" key={item.id}>
                <div>
                  <span className="category-tag">{knowledgeCategoryLabels[item.category] || "其他"}</span>
                  <h3>{item.title}</h3>
                </div>
                <p>{item.content}</p>
                <small>{(item.keywords || []).join(" / ")}</small>
              </article>
            ))}
          </div>
        </div>

        <form className="panel knowledge-form" onSubmit={handleAddKnowledge}>
          <div className="panel-heading">
            <h2>录入资料</h2>
            <span>本地会话</span>
          </div>
          <label htmlFor="knowledge-category">类型</label>
          <select
            id="knowledge-category"
            value={knowledgeForm.category}
            onChange={(event) => updateKnowledgeField("category", event.target.value)}
          >
            {Object.entries(knowledgeCategoryLabels).map(([category, label]) => (
              <option key={category} value={category}>
                {label}
              </option>
            ))}
          </select>
          <label htmlFor="knowledge-title">标题</label>
          <input
            id="knowledge-title"
            value={knowledgeForm.title}
            onChange={(event) => updateKnowledgeField("title", event.target.value)}
            placeholder="例如：标准报价规则"
          />
          <label htmlFor="knowledge-content">内容</label>
          <textarea
            id="knowledge-content"
            value={knowledgeForm.content}
            onChange={(event) => updateKnowledgeField("content", event.target.value)}
            rows={4}
            placeholder="录入产品资料、报价口径、售后政策或合同条款"
          />
          <label htmlFor="knowledge-keywords">关键词</label>
          <input
            id="knowledge-keywords"
            value={knowledgeForm.keywords}
            onChange={(event) => updateKnowledgeField("keywords", event.target.value)}
            placeholder="用逗号分隔"
          />
          <button type="submit" disabled={isSavingKnowledge}>
            {isSavingKnowledge ? "保存中" : "保存资料"}
          </button>
        </form>
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>客户管理</h2>
            <span>{customers.length} 个客户</span>
          </div>
          <div className="customer-table-wrap">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>客户</th>
                  <th>阶段</th>
                  <th>报价</th>
                  <th>回款</th>
                  <th>负责人</th>
                  <th>最近跟进</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                      <small>{customer.source}</small>
                    </td>
                    <td>
                      <span className={`stage-tag stage-${customer.stage}`}>
                        {stageLabels[customer.stage] || "未知"}
                      </span>
                    </td>
                    <td>{formatCurrency(customer.quotedAmount)}</td>
                    <td>{customer.paymentStatus}</td>
                    <td>{customer.owner}</td>
                    <td>{customer.lastFollowUpAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel ranked-panel">
          <div className="panel-heading">
            <h2>重点报价</h2>
            <span>Top {topCustomers.length}</span>
          </div>
          <div className="ranked-list">
            {topCustomers.map((customer) => (
              <div className="ranked-item" key={customer.id}>
                <div>
                  <strong>{customer.name}</strong>
                  <small>{customer.need}</small>
                </div>
                <span>{formatCurrency(customer.quotedAmount)}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="assistant-section">
        <div className="panel assistant-panel">
          <div className="panel-heading">
            <h2>AI 销售助手</h2>
            <span>引用知识库</span>
          </div>
          <form className="assistant-form" onSubmit={handleGenerate}>
            <label htmlFor="need">客户需求</label>
            <textarea
              id="need"
              value={need}
              onChange={(event) => setNeed(event.target.value)}
              rows={5}
            />
            <button type="submit" disabled={isGenerating}>
              {isGenerating ? "生成中" : "生成销售建议"}
            </button>
          </form>
        </div>

        <div className="panel result-panel">
          <div className="panel-heading">
            <h2>生成结果</h2>
            <span>{assistantResult ? "已生成" : "待生成"}</span>
          </div>
          {assistantResult ? (
            <div className="assistant-result">
              <ResultBlock title="推荐产品" content={assistantResult.recommendedProduct} />
              <ResultBlock title="报价说明" content={assistantResult.quoteDescription} />
              <ResultBlock title="微信话术" content={assistantResult.wechatMessage} />
              <ResultBlock title="跟进摘要" content={assistantResult.followUpSummary} />
              <div className="result-block">
                <h3>引用资料</h3>
                <div className="reference-list">
                  {(assistantResult.matchedKnowledge || []).map((item) => (
                    <div className="reference-item" key={item.id}>
                      <span>{knowledgeCategoryLabels[item.category] || "资料"}</span>
                      <strong>{item.title}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="result-block">
                <h3>下一步动作</h3>
                <ul>
                  {assistantResult.nextActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="empty-state">输入客户需求后生成销售建议。</div>
          )}
        </div>
      </section>
    </main>
  );
}

function ResultBlock({ title, content }) {
  return (
    <div className="result-block">
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  );
}

function formatMetric(key, value) {
  if (value === undefined || value === null) {
    return "0";
  }

  if (key === "receivableTotal") {
    return formatCurrency(value);
  }

  return `${value}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
