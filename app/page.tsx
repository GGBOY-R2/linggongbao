'use client';

import { useEffect, useState } from 'react';

type NavTab = 'home' | 'payment' | 'ai' | 'records' | 'profile';
type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const TAX_RATE = 0.01;
const INVOICE_TASK = {
  companyName: '某某技术公司',
  amount: 2000,
};
const ESTIMATED_TAX = Number((INVOICE_TASK.amount * TAX_RATE).toFixed(2));
const AI_POLICY_REPLY =
  '根据 2026 最新政策，您只需在灵工保确认企业发起的代开申请即可一站式领薪缴保。';

const userProfile = {
  name: '张小明',
  profession: '自由设计师',
  membership: '灵工保企业结算版',
  creditScore: 750,
  protectionMonths: 36,
};

const socialStatus = {
  normal: { months: 36, status: '正常', description: '连续参保稳定' },
  warning: { months: 2, status: '预警', description: '建议补足储备金' },
  danger: { months: 0, status: '断缴风险', description: '本周内完成处理' },
};

const servicePlans = [
  {
    id: 'invoice',
    name: '代开发票联动',
    price: '确认即同步',
    desc: '企业发起、个人确认、开票缴保一次完成',
    icon: '🧾',
  },
  {
    id: 'saving',
    name: '微额储备金',
    price: '按票自动沉淀',
    desc: '按开票金额联动预扣社保储备金，避免掉保',
    icon: '💼',
  },
  {
    id: 'risk',
    name: '断缴提醒',
    price: '本月已开启',
    desc: '关键节点提前提醒，保障不断线',
    icon: '🔔',
  },
  {
    id: 'records',
    name: '电子留痕',
    price: '全流程可追踪',
    desc: '开票、缴费、入账记录统一留存',
    icon: '📘',
  },
];

const quickQuestions = [
  '企业发起代开发票后怎么领工资？',
  '报酬确认后会同步缴保吗？',
  '发票确认后多久到账？',
  '断缴有什么影响？',
];

const formatCurrency = (value: number) =>
  `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [aiInput, setAiInput] = useState('');
  const [showGovModal, setShowGovModal] = useState(false);
  const [invoiceCompleted, setInvoiceCompleted] = useState(false);
  const [reserveBalance, setReserveBalance] = useState(180);
  const [socialHealth, setSocialHealth] = useState(86);
  const [toastMessage, setToastMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '您好，我是灵工保 AI 顾问，可为您解答开票、领薪、报酬与缴保联动问题。',
    },
  ]);

  const switchTab = (tab: NavTab) => {
    setActiveTab(tab);
  };

  const handleStatusClick = (status: string) => {
    console.log(`查看 ${status} 状态详情`);
  };

  const handleServiceClick = (serviceId: string) => {
    console.log(`选择服务: ${serviceId}`);
  };

  const getAIConsultantReply = (question: string) => {
    if (['发票', '领工资', '报酬'].some((keyword) => question.includes(keyword))) {
      return AI_POLICY_REPLY;
    }

    if (question.includes('社保') || question.includes('缴保')) {
      return '灵工保会将结算联动沉淀到社保储备金余额，便于后续自动代扣，减少断缴风险。';
    }

    if (question.includes('断缴')) {
      return '建议优先确认待办结算并预留社保储备金，同时开启提醒，避免保障中断。';
    }

    return '您可以继续咨询发票确认、领薪到账、报酬结算或社保储备相关问题。';
  };

  const handleAIQuestion = (question: string) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    const reply = getAIConsultantReply(trimmedQuestion);

    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: trimmedQuestion },
      { role: 'assistant', content: reply },
    ]);
  };

  const sendAIQuestion = () => {
    if (!aiInput.trim()) {
      return;
    }

    handleAIQuestion(aiInput);
    setAiInput('');
  };

  const handleInvoiceAndInsurance = (confirmed = false) => {
    if (invoiceCompleted) {
      return;
    }

    if (!confirmed) {
      setShowGovModal(true);
      return;
    }

    const reserveAmount = Number((INVOICE_TASK.amount * TAX_RATE).toFixed(2));

    setReserveBalance((prev) => Number((prev + reserveAmount).toFixed(2)));
    setSocialHealth((prev) => Math.min(prev + 3, 100));
    setInvoiceCompleted(true);
    setShowGovModal(false);
    setToastMessage(
      `发票开具成功！已同步为您存入 ${reserveAmount.toFixed(0)} 元社保储备金，保障不掉线。`,
    );
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `已完成 ${INVOICE_TASK.companyName} 劳务报酬代开确认，${formatCurrency(
          reserveAmount,
        )} 社保储备金已到账。`,
      },
    ]);
  };

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToastMessage('');
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  return (
    <div className="container lingongbao-dashboard">
      <main className="dashboard-main">
        <section className="dashboard-banner">
          <div>
            <span className="hero-tag">2026 最新政策联动</span>
            <h1>劳务报酬代开 + 以票扣保</h1>
            <p>
              企业发起代开申请后，您在灵工保确认即可模拟完成税费处理、生成数电发票，并同步沉淀社保储备金。
            </p>
          </div>
          <div className="banner-side-card">
            <span>当前账户余额</span>
            <strong>{formatCurrency(reserveBalance)}</strong>
            <small>确认开票后自动增加社保储备金</small>
          </div>
        </section>

        <section className="settlement-section">
          <h3 className="section-title">
            <span>🧾</span>
            劳务结算中心
          </h3>

          <article className={`settlement-card ${invoiceCompleted ? 'is-completed' : ''}`}>
            <div className="settlement-header">
              <div>
                <span className="settlement-kicker">待办任务</span>
                <h4>待办劳务费结算</h4>
              </div>
              <span className="settlement-badge">{invoiceCompleted ? '已完成' : '待确认'}</span>
            </div>

            <p className="settlement-desc">
              来自 <strong>{INVOICE_TASK.companyName}</strong> 的劳务费{' '}
              <strong>{formatCurrency(INVOICE_TASK.amount)}</strong> 待您确认。
            </p>

            <div className="settlement-metrics">
              <div className="settlement-metric">
                <span>劳务费金额</span>
                <strong>{formatCurrency(INVOICE_TASK.amount)}</strong>
              </div>
              <div className="settlement-metric">
                <span>预计税费</span>
                <strong>{formatCurrency(ESTIMATED_TAX)}</strong>
                <small>按 1% 模拟计算</small>
              </div>
              <div className="settlement-metric">
                <span>预扣社保</span>
                <strong>{formatCurrency(ESTIMATED_TAX)}</strong>
                <small>确认后自动转入储备金</small>
              </div>
            </div>

            <button
              className="invoice-confirm-btn"
              onClick={() => handleInvoiceAndInsurance()}
              disabled={invoiceCompleted}
            >
              {invoiceCompleted ? '已完成开票并预扣社保' : '确认开票并预扣社保'}
            </button>

            <p className="settlement-note">
              {invoiceCompleted
                ? '数电发票已生成，社保储备金已同步到账。'
                : '流程：企业发起 → 个人移动端确认 → 缴纳税费 → 生成数电发票。'}
            </p>
          </article>
        </section>

        <section className="user-card dashboard-user-card">
          <div className="user-header">
            <div className="user-avatar">灵</div>
            <div className="user-info">
              <h2>{userProfile.name}</h2>
              <div className="user-meta">
                {userProfile.profession} · {userProfile.membership}
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{userProfile.creditScore}</span>
              <span className="stat-label">信用评分</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{userProfile.protectionMonths}</span>
              <span className="stat-label">保障月数</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{socialHealth}</span>
              <span className="stat-label">社保健康度</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatCurrency(reserveBalance)}</span>
              <span className="stat-label">账户余额</span>
            </div>
          </div>
        </section>

        <section className="health-section">
          <h3 className="section-title">
            <span>🛡️</span>
            社保健康度
          </h3>

          <div className="health-card">
            <div className="health-top">
              <div className="health-score">
                <strong>{socialHealth}</strong>
                <span>分</span>
              </div>
              <span className="health-pill">{invoiceCompleted ? '保障已增强' : '待补充储备金'}</span>
            </div>

            <div className="health-progress" aria-hidden="true">
              <div className="health-progress-bar" style={{ width: `${socialHealth}%` }} />
            </div>

            <p className="health-copy">
              当前账户余额 <strong>{formatCurrency(reserveBalance)}</strong>，可用于微额社保代扣。
              {invoiceCompleted
                ? ' 本次开票已同步补足 20 元社保储备金。'
                : ' 完成待办结算后会自动增加对应储备金。'}
            </p>
          </div>
        </section>

        <section className="status-section">
          <h3 className="section-title">
            <span>📊</span>
            社保状态总览
          </h3>

          <div className="status-cards">
            <div
              className="status-card status-normal"
              onClick={() => handleStatusClick('normal')}
            >
              <span className="status-icon">✓</span>
              <div className="status-text">{socialStatus.normal.status}</div>
              <div className="status-desc">
                已连续保障 {socialStatus.normal.months} 个月 · {socialStatus.normal.description}
              </div>
            </div>

            <div
              className="status-card status-warning"
              onClick={() => handleStatusClick('warning')}
            >
              <span className="status-icon">!</span>
              <div className="status-text">{socialStatus.warning.status}</div>
              <div className="status-desc">
                还有 {socialStatus.warning.months} 项待处理 · {socialStatus.warning.description}
              </div>
            </div>

            <div
              className="status-card status-danger"
              onClick={() => handleStatusClick('danger')}
            >
              <span className="status-icon">↗</span>
              <div className="status-text">{socialStatus.danger.status}</div>
              <div className="status-desc">{socialStatus.danger.description}</div>
            </div>
          </div>
        </section>

        <section className="service-section">
          <h3 className="section-title">
            <span>📦</span>
            智能服务方案
          </h3>

          <div className="service-grid">
            {servicePlans.map((plan) => (
              <div
                key={plan.id}
                className="service-card"
                onClick={() => handleServiceClick(plan.id)}
              >
                <div className="service-icon">{plan.icon}</div>
                <div className="service-title">{plan.name}</div>
                <div className="service-desc">{plan.desc}</div>
                <div className="service-price">{plan.price}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="ai-card">
          <div className="ai-header">
            <div className="ai-avatar">AI</div>
            <div className="ai-title">
              <h3>AI 顾问</h3>
              <div className="ai-status">
                <span className="status-dot"></span>
                <span>实时解答领薪缴保联动问题</span>
              </div>
            </div>
          </div>

          <div className="ai-conversation">
            {chatMessages.slice(-5).map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`ai-message ${message.role === 'assistant' ? 'assistant' : 'user'}`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="ai-quick-questions">
            {quickQuestions.map((question) => (
              <button
                key={question}
                className="quick-question"
                onClick={() => handleAIQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>

          <div className="ai-input-area">
            <input
              type="text"
              className="ai-input"
              placeholder="请输入发票、领工资、报酬等问题..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sendAIQuestion();
                }
              }}
            />
            <button className="ai-send-btn" onClick={sendAIQuestion}>
              →
            </button>
          </div>
        </section>
      </main>

      <nav className="bottom-nav">
        <div className="nav-items">
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => switchTab('home')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">首页</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => switchTab('payment')}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-text">结算</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => switchTab('ai')}
          >
            <span className="nav-icon">🤖</span>
            <span className="nav-text">AI 顾问</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => switchTab('records')}
          >
            <span className="nav-icon">🧾</span>
            <span className="nav-text">记录</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => switchTab('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">我的</span>
          </button>
        </div>
      </nav>

      {showGovModal && (
        <div
          className="gov-modal-backdrop"
          onClick={() => setShowGovModal(false)}
          role="presentation"
        >
          <div
            className="gov-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gov-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="gov-modal-tag">政务端跳转确认</span>
            <h3 id="gov-modal-title">确认办理劳务报酬代开发票</h3>
            <p>
              企业已发起代开申请。确认后将模拟完成税费处理，并按开票金额 1% 自动预扣社保储备金。
            </p>

            <div className="gov-modal-summary">
              <div>
                <span>企业名称</span>
                <strong>{INVOICE_TASK.companyName}</strong>
              </div>
              <div>
                <span>开票金额</span>
                <strong>{formatCurrency(INVOICE_TASK.amount)}</strong>
              </div>
              <div>
                <span>预计存入</span>
                <strong>{formatCurrency(ESTIMATED_TAX)}</strong>
              </div>
            </div>

            <div className="gov-modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setShowGovModal(false)}>
                稍后处理
              </button>
              <button
                className="modal-btn modal-btn-primary"
                onClick={() => handleInvoiceAndInsurance(true)}
              >
                确认并继续
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="floating-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
