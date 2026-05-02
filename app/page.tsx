'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [aiInput, setAiInput] = useState('');

  // 社保状态数据
  const [socialStatus, setSocialStatus] = useState({
    normal: { months: 36, status: '正常' },
    warning: { months: 2, status: '预警' },
    danger: { months: 0, status: '断缴' }
  });

  // 用户数据
  const [userData, setUserData] = useState({
    name: '张小明',
    profession: '自由设计师',
    membership: '黄金会员',
    creditScore: 750,
    protectionMonths: 36,
    totalPayment: '4.3万'
  });

  // 服务方案数据
  const servicePlans = [
    { id: 'order', name: '订单险', price: '¥800/项目', desc: '按项目投保，灵活可控', icon: '📋' },
    { id: 'saving', name: '灵活储蓄', price: '¥1200/月', desc: '定期定额，理财保障', icon: '💰' },
    { id: 'monthly', name: '传统月缴', price: '¥1500/月', desc: '稳定可靠，长期保障', icon: '🔄' },
    { id: 'blockchain', name: '区块链存证', price: '156条记录', desc: '安全可信，永久保存', icon: '⛓️' }
  ];

  // AI快速问题
  const quickQuestions = [
    '怎么交社保？',
    '断缴有什么影响？',
    '灵活就业怎么参保？',
    '报销需要什么材料？'
  ];

  // 切换底部导航
  const switchTab = (tab: string) => {
    setActiveTab(tab);
  };

  // 处理社保状态点击
  const handleStatusClick = (status: string) => {
    console.log(`查看${status}状态详情`);
    // 这里可以扩展为导航到详情页或显示模态框
  };

  // 处理服务选择
  const handleServiceClick = (serviceId: string) => {
    const selectedService = servicePlans.find(plan => plan.id === serviceId);
    console.log(`选择服务: ${selectedService?.name}`);
    // 这里可以扩展为显示服务详情页
  };

  // 处理AI问题
  const handleAIQuestion = (question: string) => {
    console.log(`AI咨询: ${question}`);
    // 这里可以连接到实际的AI API
  };

  // 发送AI问题
  const sendAIQuestion = () => {
    if (aiInput.trim()) {
      handleAIQuestion(aiInput);
      setAiInput('');
    }
  };

  // AI输入框回车处理
  const handleAIInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendAIQuestion();
    }
  };

  // 性能监控
  useEffect(() => {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      console.log(`页面加载时间: ${loadTime}ms`);
    }
  }, []);

  return (
    <div className="lingongbao-container">
        {/* 用户信息卡片 */}
        <section className="user-card">
          <div className="user-header">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <h2>{userData.name}</h2>
              <div className="user-meta">{userData.profession} · {userData.membership}</div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{userData.creditScore}</span>
              <span className="stat-label">信用评分</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{userData.protectionMonths}</span>
              <span className="stat-label">保障月数</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{userData.totalPayment}</span>
              <span className="stat-label">累计缴费</span>
            </div>
          </div>
        </section>

        {/* 社保状态总览 */}
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
              <span className="status-icon">✅</span>
              <div className="status-text">{socialStatus.normal.status}</div>
              <div className="status-desc">连续缴费{socialStatus.normal.months}月</div>
            </div>
            <div
              className="status-card status-warning"
              onClick={() => handleStatusClick('warning')}
            >
              <span className="status-icon">⚠️</span>
              <div className="status-text">{socialStatus.warning.status}</div>
              <div className="status-desc">{socialStatus.warning.months}个月待缴</div>
            </div>
            <div
              className="status-card status-danger"
              onClick={() => handleStatusClick('danger')}
            >
              <span className="status-icon">❌</span>
              <div className="status-text">{socialStatus.danger.status}</div>
              <div className="status-desc">需尽快补缴</div>
            </div>
          </div>
        </section>

        {/* 智能缴费方案 */}
        <section className="service-section">
          <h3 className="section-title">
            <span>🎯</span>
            智能缴费方案
          </h3>
          <div className="service-grid">
            {servicePlans.map((plan, index) => (
              <div
                key={plan.id}
                className="service-card"
                onClick={() => handleServiceClick(plan.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="service-icon">{plan.icon}</div>
                <div className="service-title">{plan.name}</div>
                <div className="service-desc">{plan.desc}</div>
                <div className="service-price">{plan.price}</div>
              </div>
            ))}
          </div>
        </section>

        {/* AI助手 */}
        <section className="ai-card">
          <div className="ai-header">
            <div className="ai-avatar">AI</div>
            <div className="ai-title">
              <h3>灵工AI助手</h3>
              <div className="ai-status">
                <span className="status-dot"></span>
                <span>在线服务中</span>
              </div>
            </div>
          </div>

          <div className="ai-quick-questions">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
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
              placeholder="请输入您的问题..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyPress={handleAIInputKeyPress}
            />
            <button className="ai-send-btn" onClick={sendAIQuestion}>
              ➤
            </button>
          </div>
        </section>

        {/* 底部导航 */}
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
              <span className="nav-icon">💰</span>
              <span className="nav-text">缴费</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => switchTab('ai')}
            >
              <span className="nav-icon">🤖</span>
              <span className="nav-text">AI咨询</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}
              onClick={() => switchTab('records')}
            >
              <span className="nav-icon">📊</span>
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
      </div>
    );
}