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

const sampleNeed =
  "客户要适合小型工厂的进销存系统，预算 3 万以内，需要微信通知和报价管理。";

export default function HomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [need, setNeed] = useState(sampleNeed);
  const [assistantResult, setAssistantResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const [dashboardResponse, customersResponse] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/customers"),
      ]);

      if (!dashboardResponse.ok || !customersResponse.ok) {
        setError("经营数据加载失败。");
        return;
      }

      setDashboard(await dashboardResponse.json());
      setCustomers(await customersResponse.json());
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

  async function handleGenerate(event) {
    event.preventDefault();
    setIsGenerating(true);
    setError("");

    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ need }),
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Web MVP · 第一阶段</p>
          <h1>中小企业 AI 经营助理</h1>
        </div>
        <div className="status-pill">本地演示数据</div>
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
            <span>规则生成</span>
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
