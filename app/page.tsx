'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type MenuView = 'registration' | 'dashboard' | 'risk' | 'settlement' | 'ai';
type ChatRole = 'assistant' | 'user';

type FormState = {
  occupation: string;
  monthlyIncome: number;
  volatility: number;
  socialBalance: number;
};

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const AI_WELCOME =
  '您好，我是灵工保 AI 助手。已为您同步最新政务接口，您可以询问关于劳务开票或社保补缴的问题。';

const INITIAL_FORM: FormState = {
  occupation: '外卖骑手',
  monthlyIncome: 12000,
  volatility: 35,
  socialBalance: 4800,
};

const INITIAL_PENDING_AMOUNT = 3200;

const menuItems: Array<{
  key: MenuView;
  title: string;
  description: string;
}> = [
  {
    key: 'registration',
    title: '基础信息登记',
    description: '录入收入、波动率与社保余额',
  },
  {
    key: 'dashboard',
    title: '数据看板',
    description: '查看同步后的关键运营指标',
  },
  {
    key: 'risk',
    title: '参保风险预警',
    description: '查看断缴概率与风险仪表盘',
  },
  {
    key: 'settlement',
    title: '劳务结算',
    description: '确认开票并同步账户金额',
  },
  {
    key: 'ai',
    title: 'AI 政策顾问',
    description: '咨询开票、补缴与政务问题',
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const roundToHundred = (value: number) => Math.round(value / 100) * 100;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(value);

const getRiskModel = (monthlyIncome: number, volatility: number, accountTotal: number) => {
  let probability =
    volatility > 30
      ? 62 + Math.round((volatility - 30) * 0.6)
      : volatility > 15
        ? 32 + Math.round((volatility - 15) * 1.4)
        : 12 + Math.round(volatility * 1.1);

  if (accountTotal < monthlyIncome * 0.6) {
    probability += 12;
  } else if (accountTotal < monthlyIncome) {
    probability += 6;
  } else if (accountTotal > monthlyIncome * 1.5) {
    probability -= 6;
  }

  probability = clamp(probability, 8, 95);

  const level = probability >= 60 ? '高风险' : probability >= 35 ? '中风险' : '低风险';
  const recommendedBuffer = roundToHundred(
    monthlyIncome * (level === '高风险' ? 0.35 : level === '中风险' ? 0.22 : 0.15),
  );
  const protectionIndex = clamp(
    Math.round(100 - probability + Math.min(18, (accountTotal / Math.max(monthlyIncome, 1)) * 10)),
    22,
    96,
  );

  const summary =
    level === '高风险'
      ? '波动率已超过 30%，建议优先确认开票并准备补缴缓冲金。'
      : level === '中风险'
        ? '当前波动处于观察区间，建议按周复核收入与余额变化。'
        : '当前参保稳定度较好，可按月巡检并持续保留缓冲余额。';

  const actions =
    level === '高风险'
      ? [
          '优先完成待确认开票，尽快回补社保账户总额。',
          `建议预留不少于 ${formatCurrency(recommendedBuffer)} 的补缴缓冲金。`,
          '同步核对最近三个月收入回款，避免再次断缴。',
        ]
      : level === '中风险'
        ? [
            '保持每周一次的结算复核频率。',
            `建议逐步补足至 ${formatCurrency(recommendedBuffer)} 的安全缓冲区间。`,
            '若波动继续上升，请提前调整缴费计划。',
          ]
        : [
            '维持当前缴费节奏即可。',
            `建议保留 ${formatCurrency(recommendedBuffer)} 作为月度缓冲金。`,
            '继续按月核对收入与社保余额。',
          ];

  return {
    probability,
    level,
    recommendedBuffer,
    protectionIndex,
    summary,
    actions,
  };
};

const getAssistantReply = ({
  question,
  monthlyIncome,
  riskLevel,
  riskProbability,
  recommendedBuffer,
  pendingAmount,
  accountTotal,
}: {
  question: string;
  monthlyIncome: number;
  riskLevel: string;
  riskProbability: number;
  recommendedBuffer: number;
  pendingAmount: number;
  accountTotal: number;
}) => {
  if (question.includes('开票') || question.includes('劳务')) {
    return pendingAmount > 0
      ? `当前仍有 ${formatCurrency(pendingAmount)} 待确认金额，您可以在“劳务结算”中点击“确认开票”，系统会同步增加账户总额。`
      : '当前待确认开票事项已处理完成，账户总额已完成同步更新。';
  }

  if (question.includes('补缴') || question.includes('社保')) {
    return `根据当前 ${riskLevel} 判断，建议至少预留 ${formatCurrency(
      recommendedBuffer,
    )} 作为补缴缓冲。账户总额现为 ${formatCurrency(accountTotal)}。`;
  }

  if (question.includes('风险') || question.includes('断缴')) {
    return `当前断缴概率为 ${riskProbability}%，风险等级为 ${riskLevel}。若需降低风险，请先控制波动率并补足余额缓冲。`;
  }

  return `已同步当前看板：月收入 ${formatCurrency(monthlyIncome)}，风险等级 ${riskLevel}，断缴概率 ${riskProbability}%。如需继续，我可以说明开票流程或社保补缴建议。`;
};

export default function Page() {
  const [activeView, setActiveView] = useState<MenuView>('registration');
  const [draftForm, setDraftForm] = useState<FormState>(INITIAL_FORM);
  const [profile, setProfile] = useState<FormState>(INITIAL_FORM);
  const [pendingAmount, setPendingAmount] = useState(INITIAL_PENDING_AMOUNT);
  const [pendingTasks, setPendingTasks] = useState(1);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState('尚未重新同步');
  const [toast, setToast] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: AI_WELCOME },
  ]);

  const accountTotal = profile.socialBalance + confirmedTotal;

  const riskModel = useMemo(
    () => getRiskModel(profile.monthlyIncome, profile.volatility, accountTotal),
    [accountTotal, profile.monthlyIncome, profile.volatility],
  );

  const serviceStatus =
    riskModel.level === '高风险'
      ? '需重点跟进'
      : riskModel.level === '中风险'
        ? '建议每周复核'
        : '可按月巡检';

  const protectionMonthRatio = clamp(
    Math.round((accountTotal / Math.max(profile.monthlyIncome, 1)) * 100),
    10,
    180,
  );

  const gaugeAngle = -90 + riskModel.probability * 1.8;

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigateTo = (view: MenuView) => {
    setActiveView(view);
    document.getElementById(`section-${view}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextProfile = {
      ...draftForm,
      monthlyIncome: Math.max(0, draftForm.monthlyIncome),
      volatility: clamp(draftForm.volatility, 10, 100),
      socialBalance: Math.max(0, draftForm.socialBalance),
    };

    setProfile(nextProfile);
    setActiveView('dashboard');
    setLastSyncedAt(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
    setToast('参保信息已同步，数据看板与风险预警已刷新。');
  };

  const handleConfirmInvoice = () => {
    if (pendingAmount <= 0) {
      return;
    }

    const confirmedAmount = pendingAmount;
    setConfirmedTotal((current) => current + confirmedAmount);
    setConfirmedCount((current) => current + 1);
    setPendingAmount(0);
    setPendingTasks(0);
    setActiveView('settlement');
    setToast('开票已确认，账户总额已同步增加。');
    setChatMessages((current) => [
      ...current,
      {
        role: 'assistant',
        content: `已确认 ${formatCurrency(
          confirmedAmount,
        )} 的劳务开票，账户总额已同步更新，您可以继续查看风险预警结果。`,
      },
    ]);
  };

  const submitQuestion = (question: string) => {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    const reply = getAssistantReply({
      question: trimmed,
      monthlyIncome: profile.monthlyIncome,
      riskLevel: riskModel.level,
      riskProbability: riskModel.probability,
      recommendedBuffer: riskModel.recommendedBuffer,
      pendingAmount,
      accountTotal,
    });

    setChatMessages((current) => [
      ...current,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: reply },
    ]);
    setChatInput('');
    setActiveView('ai');
  };

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitQuestion(chatInput);
  };

  return (
    <>
      <div className="appShell">
        <aside className="sidebar">
          <div className="brandCard">
            <p className="brandEyebrow">灵工保管理中心</p>
            <h1>灵工保</h1>
            <p className="brandCopy">登记基础信息后，系统会同步刷新数据看板、风险预警与劳务结算状态。</p>
          </div>

          <nav className="menuList" aria-label="系统菜单">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`menuButton ${activeView === item.key ? 'menuButtonActive' : ''}`}
                onClick={() => navigateTo(item.key)}
              >
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </nav>

          <div className="statusCard">
            <p className="statusLabel">当前服务状态</p>
            <strong>{serviceStatus}</strong>
            <span>
              风险等级：{riskModel.level} · 断缴概率：{riskModel.probability}%
            </span>
          </div>
        </aside>

        <div className="contentArea">
          <header className="pageHeader">
            <div>
              <p className="pageEyebrow">灵活就业参保服务功能</p>
              <h2>数据联动看板</h2>
              <p className="pageIntro">
                保存参保信息后，下方所有白色卡片将根据输入值自动刷新，不再展示静态演示数据。
              </p>
            </div>

            <div className="headerMetrics">
              <article className="page-card metricCard">
                <span>账户总额</span>
                <strong>{formatCurrency(accountTotal)}</strong>
              </article>
              <article className="page-card metricCard">
                <span>待确认金额</span>
                <strong>{formatCurrency(pendingAmount)}</strong>
              </article>
              <article className="page-card metricCard">
                <span>最新同步</span>
                <strong>{lastSyncedAt}</strong>
              </article>
            </div>
          </header>

          <main className="sections">
            <section
              id="section-registration"
              className={`page-card sectionCard ${activeView === 'registration' ? 'sectionFocused' : ''}`}
            >
              <div className="sectionHeader">
                <div>
                  <p className="sectionEyebrow">信息来源</p>
                  <h3 className="card-title">参保信息登记</h3>
                  <p className="sectionCopy">
                    请先录入职业类型、月收入、波动率与当前社保余额，再点击“保存并更新看板”。
                  </p>
                </div>
                <span className="sectionBadge">已同步到看板与预警模块</span>
              </div>

              <form className="registrationForm" onSubmit={handleSaveProfile}>
                <label className="field">
                  <span>职业类型</span>
                  <select
                    value={draftForm.occupation}
                    onChange={(event) =>
                      setDraftForm((current) => ({ ...current, occupation: event.target.value }))
                    }
                  >
                    <option value="外卖骑手">外卖骑手</option>
                    <option value="网约车司机">网约车司机</option>
                    <option value="自由设计师">自由设计师</option>
                    <option value="劳务派遣人员">劳务派遣人员</option>
                  </select>
                </label>

                <label className="field">
                  <span>月收入</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={draftForm.monthlyIncome}
                    onChange={(event) =>
                      setDraftForm((current) => ({
                        ...current,
                        monthlyIncome: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>波动率（10% - 100%）</span>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    step={1}
                    value={draftForm.volatility}
                    onChange={(event) =>
                      setDraftForm((current) => ({
                        ...current,
                        volatility: Number(event.target.value) || 10,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>当前社保余额</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={draftForm.socialBalance}
                    onChange={(event) =>
                      setDraftForm((current) => ({
                        ...current,
                        socialBalance: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </label>

                <button className="primaryButton" type="submit">
                  保存并更新看板
                </button>
              </form>
            </section>

            <section
              id="section-dashboard"
              className={`page-card sectionCard ${activeView === 'dashboard' ? 'sectionFocused' : ''}`}
            >
              <div className="sectionHeader">
                <div>
                  <p className="sectionEyebrow">核心数据</p>
                  <h3 className="card-title">数据看板</h3>
                  <p className="sectionCopy">以下数值全部由“参保信息登记”与“劳务结算”结果实时驱动。</p>
                </div>
                <span className="sectionBadge">{profile.occupation}</span>
              </div>

              <div className="statsGrid">
                <article className="statCard">
                  <span>月收入</span>
                  <strong>{formatCurrency(profile.monthlyIncome)}</strong>
                </article>
                <article className="statCard">
                  <span>收入波动率</span>
                  <strong>{profile.volatility}%</strong>
                </article>
                <article className="statCard">
                  <span>账户总额</span>
                  <strong>{formatCurrency(accountTotal)}</strong>
                </article>
                <article className="statCard">
                  <span>断缴概率</span>
                  <strong>{riskModel.probability}%</strong>
                </article>
                <article className="statCard">
                  <span>推荐缓冲金</span>
                  <strong>{formatCurrency(riskModel.recommendedBuffer)}</strong>
                </article>
                <article className="statCard">
                  <span>服务状态</span>
                  <strong>{serviceStatus}</strong>
                </article>
              </div>

              <div className="summaryStrip">
                <div>
                  <span>当前摘要</span>
                  <strong>{riskModel.summary}</strong>
                </div>
                <div>
                  <span>保障覆盖度</span>
                  <strong>{protectionMonthRatio}%</strong>
                </div>
              </div>
            </section>

            <section
              id="section-risk"
              className={`page-card sectionCard ${activeView === 'risk' ? 'sectionFocused' : ''}`}
            >
              <div className="sectionHeader">
                <div>
                  <p className="sectionEyebrow">风险识别</p>
                  <h3 className="card-title">参保风险预警</h3>
                  <p className="sectionCopy">
                    当波动率大于 30% 时，系统自动判定为高风险，并将断缴概率提升到 60% 以上。
                  </p>
                </div>
                <span
                  className={`riskBadge ${
                    riskModel.level === '高风险'
                      ? 'riskHigh'
                      : riskModel.level === '中风险'
                        ? 'riskMedium'
                        : 'riskLow'
                  }`}
                >
                  {riskModel.level}
                </span>
              </div>

              <div className="riskLayout">
                <div className="gaugePanel">
                  <div className="halfGauge">
                    <div className="halfGaugeTrack" />
                    <div className="halfGaugeInner" />
                    <div
                      className="gaugeNeedle"
                      style={{ transform: `translateX(-50%) rotate(${gaugeAngle}deg)` }}
                    />
                    <div className="gaugeHub" />
                  </div>
                  <div className="gaugeLabels">
                    <span>低风险</span>
                    <span>中风险</span>
                    <span>高风险</span>
                  </div>
                </div>

                <div className="riskDetails">
                  <article className="detailCard">
                    <span>风险等级</span>
                    <strong>{riskModel.level}</strong>
                  </article>
                  <article className="detailCard">
                    <span>断缴概率</span>
                    <strong>{riskModel.probability}%</strong>
                  </article>
                  <article className="detailCard">
                    <span>保障指数</span>
                    <strong>{riskModel.protectionIndex} 分</strong>
                  </article>
                  <article className="detailCard">
                    <span>补缴建议</span>
                    <strong>{formatCurrency(riskModel.recommendedBuffer)}</strong>
                  </article>

                  <div className="actionList">
                    {riskModel.actions.map((action) => (
                      <div key={action} className="actionItem">
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section
              id="section-settlement"
              className={`page-card sectionCard ${activeView === 'settlement' ? 'sectionFocused' : ''}`}
            >
              <div className="sectionHeader settlementHeader">
                <div>
                  <p className="sectionEyebrow">流程执行</p>
                  <h3 className="card-title">劳务结算</h3>
                  <p className="sectionCopy">
                    确认开票后，待办将减少，账户总额会即时同步到数据看板与风险预警。
                  </p>
                </div>

                <div className="balanceCard">
                  <span>账户余额</span>
                  <strong>{formatCurrency(accountTotal)}</strong>
                </div>
              </div>

              <div className="settlementGrid">
                <article className="settlementCard">
                  <span>待确认金额</span>
                  <strong>{formatCurrency(pendingAmount)}</strong>
                  <small>当前待办：{pendingTasks} 笔</small>
                </article>
                <article className="settlementCard">
                  <span>已确认开票</span>
                  <strong>{formatCurrency(confirmedTotal)}</strong>
                  <small>累计完成：{confirmedCount} 笔</small>
                </article>
                <article className="settlementCard">
                  <span>同步后账户总额</span>
                  <strong>{formatCurrency(accountTotal)}</strong>
                  <small>已纳入看板与预警计算</small>
                </article>
              </div>

              <div className="settlementFooter">
                <button
                  className="primaryButton"
                  type="button"
                  onClick={handleConfirmInvoice}
                  disabled={pendingAmount <= 0}
                >
                  确认开票
                </button>
                <p className="settlementNote">
                  {pendingAmount > 0
                    ? '确认后，待确认金额会清零，账户总额会自动增加。'
                    : '当前待确认金额已处理完成，您可以继续查看更新后的风险仪表盘。'}
                </p>
              </div>
            </section>

            <section
              id="section-ai"
              className={`page-card sectionCard ${activeView === 'ai' ? 'sectionFocused' : ''}`}
            >
              <div className="sectionHeader">
                <div>
                  <p className="sectionEyebrow">智能问答</p>
                  <h3 className="card-title">AI 政策顾问</h3>
                  <p className="sectionCopy">右下角聊天框已默认展开，您也可以点击下方快捷问题直接咨询。</p>
                </div>
                <span className="sectionBadge">在线服务中</span>
              </div>

              <div className="quickActions">
                <button type="button" className="ghostButton" onClick={() => submitQuestion('如何确认开票？')}>
                  如何确认开票？
                </button>
                <button type="button" className="ghostButton" onClick={() => submitQuestion('社保补缴怎么处理？')}>
                  社保补缴怎么处理？
                </button>
                <button type="button" className="ghostButton" onClick={() => submitQuestion('当前风险高吗？')}>
                  当前风险高吗？
                </button>
              </div>
            </section>
          </main>
        </div>

        <aside className="assistantDock">
          <div className="assistantHeader">
            <div>
              <strong>AI 政策顾问</strong>
              <span>已展开 · 政务接口已同步</span>
            </div>
          </div>

          <div className="assistantBody">
            <div className="assistantMessages">
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`messageBubble ${
                    message.role === 'assistant' ? 'assistantBubble' : 'userBubble'
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <form className="assistantComposer" onSubmit={handleChatSubmit}>
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="请输入开票或补缴问题"
              />
              <button type="submit" className="primaryButton compactButton">
                发送
              </button>
            </form>
          </div>
        </aside>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <style jsx>{`
        .appShell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 24px;
          padding: 24px;
          color: #1a202c;
        }

        .sidebar {
          position: sticky;
          top: 24px;
          align-self: start;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .brandCard,
        .statusCard {
          padding: 22px;
          border-radius: 22px;
          background: linear-gradient(180deg, #0b5cad 0%, #083b73 100%);
          color: #ffffff;
          box-shadow: 0 14px 32px rgb(11 92 173 / 0.22);
        }

        .brandEyebrow,
        .statusLabel,
        .pageEyebrow,
        .sectionEyebrow {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .brandCard h1,
        .pageHeader h2 {
          margin: 0;
        }

        .brandCopy,
        .statusCard span,
        .pageIntro,
        .sectionCopy,
        .settlementNote {
          margin: 10px 0 0;
          line-height: 1.7;
          color: #475569;
        }

        .brandCard .brandCopy,
        .statusCard span {
          color: rgba(255, 255, 255, 0.88);
        }

        .menuList {
          display: grid;
          gap: 10px;
        }

        .menuButton {
          padding: 14px 16px;
          border: 1px solid #dbe7f5;
          border-radius: 16px;
          background: #ffffff;
          text-align: left;
          color: #1a202c;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .menuButton:hover {
          transform: translateY(-1px);
          border-color: #93c5fd;
        }

        .menuButton strong {
          display: block;
          color: #0b5cad;
          font-size: 15px;
        }

        .menuButton span {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        .menuButtonActive {
          background: #eaf3ff;
          border-color: #0b5cad;
        }

        .statusCard strong {
          display: block;
          margin-bottom: 8px;
          font-size: 20px;
        }

        .contentArea {
          min-width: 0;
          padding-right: 420px;
        }

        .pageHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .pageEyebrow,
        .sectionEyebrow {
          color: #0b5cad;
        }

        .pageHeader h2 {
          font-size: 32px;
          color: #1a202c;
          line-height: 1.2;
        }

        .headerMetrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          min-width: 460px;
        }

        .metricCard {
          padding: 18px;
        }

        .metricCard span,
        .statCard span,
        .detailCard span,
        .settlementCard span,
        .balanceCard span,
        .summaryStrip span {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          color: #64748b;
        }

        .metricCard strong,
        .statCard strong,
        .detailCard strong,
        .settlementCard strong,
        .balanceCard strong,
        .summaryStrip strong {
          display: block;
          color: #1a202c;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 700;
        }

        .sections {
          display: grid;
          gap: 20px;
          padding-bottom: 120px;
        }

        .sectionCard {
          padding: 24px;
        }

        .sectionFocused {
          outline: 2px solid rgb(11 92 173 / 0.12);
          outline-offset: 0;
        }

        .sectionHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .sectionBadge,
        .riskBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .sectionBadge {
          background: #eaf3ff;
          color: #0b5cad;
        }

        .riskLow {
          background: #dcfce7;
          color: #166534;
        }

        .riskMedium {
          background: #fef3c7;
          color: #92400e;
        }

        .riskHigh {
          background: #fee2e2;
          color: #b91c1c;
        }

        .registrationForm {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          align-items: end;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field span {
          font-size: 13px;
          font-weight: 600;
          color: #1a202c;
        }

        .field input,
        .field select,
        .assistantComposer input {
          width: 100%;
          height: 46px;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 0 14px;
          background: #ffffff;
          color: #1a202c;
          outline: none;
        }

        .field input:focus,
        .field select:focus,
        .assistantComposer input:focus {
          border-color: #0b5cad;
          box-shadow: 0 0 0 3px rgb(11 92 173 / 0.12);
        }

        .primaryButton,
        .ghostButton {
          height: 46px;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .primaryButton {
          background: #0b5cad;
          color: #ffffff;
          box-shadow: 0 10px 20px rgb(11 92 173 / 0.2);
        }

        .primaryButton:hover:not(:disabled),
        .ghostButton:hover {
          transform: translateY(-1px);
        }

        .primaryButton:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .ghostButton {
          padding: 0 18px;
          background: #ffffff;
          color: #0b5cad;
          border: 1px solid #bfdbfe;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.08);
        }

        .statsGrid,
        .settlementGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .statCard,
        .detailCard,
        .settlementCard,
        .summaryStrip,
        .balanceCard,
        .actionItem {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .statCard,
        .detailCard,
        .settlementCard,
        .balanceCard {
          padding: 18px;
        }

        .summaryStrip {
          margin-top: 16px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .riskLayout {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 24px;
          align-items: center;
        }

        .gaugePanel {
          display: grid;
          gap: 12px;
          justify-items: center;
        }

        .halfGauge {
          position: relative;
          width: 280px;
          height: 150px;
          overflow: hidden;
        }

        .halfGaugeTrack {
          position: absolute;
          left: 0;
          top: 0;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: conic-gradient(
            from 180deg,
            #22c55e 0deg 60deg,
            #f59e0b 60deg 120deg,
            #ef4444 120deg 180deg,
            transparent 180deg 360deg
          );
        }

        .halfGaugeInner {
          position: absolute;
          left: 38px;
          top: 38px;
          width: 204px;
          height: 204px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: inset 0 0 0 1px #e2e8f0;
        }

        .gaugeNeedle {
          position: absolute;
          left: 50%;
          bottom: 10px;
          width: 4px;
          height: 92px;
          border-radius: 999px;
          background: #1a202c;
          transform-origin: center bottom;
          transition: transform 0.3s ease;
          z-index: 2;
        }

        .gaugeHub {
          position: absolute;
          left: 50%;
          bottom: 4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1a202c;
          transform: translateX(-50%);
          z-index: 3;
        }

        .gaugeLabels {
          width: 100%;
          display: flex;
          justify-content: space-between;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
        }

        .riskDetails {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .actionList {
          grid-column: 1 / -1;
          display: grid;
          gap: 12px;
        }

        .actionItem {
          padding: 16px 18px;
          color: #334155;
          line-height: 1.65;
        }

        .settlementHeader {
          align-items: center;
        }

        .balanceCard {
          min-width: 220px;
        }

        .settlementCard small {
          display: block;
          margin-top: 8px;
          color: #64748b;
        }

        .settlementFooter {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 18px;
        }

        .quickActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .assistantDock {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 380px;
          border-radius: 22px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #dbe7f5;
          box-shadow: 0 24px 48px rgb(15 23 42 / 0.18);
        }

        .assistantHeader {
          padding: 18px 20px;
          background: #0b5cad;
          color: #ffffff;
        }

        .assistantHeader strong {
          display: block;
          font-size: 17px;
        }

        .assistantHeader span {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.88);
        }

        .assistantBody {
          display: grid;
          gap: 14px;
          padding: 16px;
        }

        .assistantMessages {
          height: 320px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 6px;
        }

        .messageBubble {
          max-width: 88%;
          padding: 12px 14px;
          border-radius: 16px;
          line-height: 1.7;
          font-size: 14px;
          word-break: break-word;
        }

        .assistantBubble {
          align-self: flex-start;
          background: #edf4ff;
          color: #1a202c;
        }

        .userBubble {
          align-self: flex-end;
          background: #0b5cad;
          color: #ffffff;
        }

        .assistantComposer {
          display: flex;
          gap: 10px;
        }

        .compactButton {
          width: 88px;
          flex: none;
        }

        .toast {
          position: fixed;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%);
          padding: 12px 18px;
          border-radius: 999px;
          background: #1a202c;
          color: #ffffff;
          box-shadow: 0 18px 36px rgb(15 23 42 / 0.22);
          z-index: 60;
        }

        @media (max-width: 1280px) {
          .appShell {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: static;
          }

          .contentArea {
            padding-right: 0;
          }

          .assistantDock {
            position: static;
            width: 100%;
            margin-top: 4px;
          }

          .pageHeader {
            flex-direction: column;
          }

          .headerMetrics {
            min-width: 0;
            width: 100%;
          }
        }

        @media (max-width: 900px) {
          .registrationForm,
          .statsGrid,
          .settlementGrid,
          .riskDetails,
          .headerMetrics {
            grid-template-columns: 1fr;
          }

          .riskLayout {
            grid-template-columns: 1fr;
          }

          .summaryStrip,
          .settlementFooter,
          .sectionHeader {
            flex-direction: column;
            align-items: flex-start;
          }

          .balanceCard {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
