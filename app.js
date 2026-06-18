const STORAGE_KEY = "job-management-state-v1";

const modules = {
  overview: {
    label: "总览",
    sub: "今日焦点",
    icon: "layout-dashboard",
  },
  projects: {
    label: "项目管理",
    sub: "推进、风险、截止日",
    icon: "folder-kanban",
  },
  channels: {
    label: "渠道管理",
    sub: "BBY / NATM / GMA",
    icon: "network",
  },
  knowledge: {
    label: "知识与信息",
    sub: "记录、口径、来源",
    icon: "library-big",
  },
};

const moduleLinks = {
  overview: [
    {
      module: "projects",
      title: "项目管理主控台",
      caption: "打开在线项目管理页",
      url: "https://abchaoming1.github.io/Project-Management/",
      icon: "monitor-up",
      badge: "Online",
    },
    {
      module: "channels",
      title: "NATM 渠道看板",
      caption: "进入 NATM summarySection",
      url: "https://abchaoming1.github.io/NATM/#summarySection",
      icon: "chart-no-axes-combined",
      badge: "NATM",
    },
    {
      module: "channels",
      title: "电视购物渠道",
      caption: "进入 GMA 工作页",
      url: "https://abchaoming1.github.io/GMA/",
      icon: "tv",
      badge: "GMA",
    },
    {
      module: "knowledge",
      title: "Everyday-Records",
      caption: "知识与信息管理网页",
      url: "https://abchaoming1.github.io/Everyday-Records/",
      icon: "book-marked",
      badge: "Pages",
    },
  ],
  projects: [
    {
      module: "projects",
      title: "项目管理主控台",
      caption: "主要项目入口：https://abchaoming1.github.io/Project-Management/",
      url: "https://abchaoming1.github.io/Project-Management/",
      icon: "monitor-up",
      badge: "Online",
    },
  ],
  channels: [
    {
      module: "channels",
      title: "NATM 渠道",
      caption: "NFM / Abt / BSM / RCW 渠道汇总",
      url: "https://abchaoming1.github.io/NATM/#summarySection",
      icon: "chart-no-axes-combined",
      badge: "NATM",
    },
    {
      module: "channels",
      title: "电视购物渠道",
      caption: "GMA TV shopping 工作台",
      url: "https://abchaoming1.github.io/GMA/",
      icon: "tv",
      badge: "GMA",
    },
  ],
  knowledge: [
    {
      module: "knowledge",
      title: "Everyday-Records",
      caption: "每日知识与信息记录网页",
      url: "https://abchaoming1.github.io/Everyday-Records/",
      icon: "book-marked",
      badge: "Pages",
    },
  ],
};

const optionSets = {
  projectStatus: ["进行中", "等待他人", "已暂停", "已完成", "有风险"],
  projectPriority: ["P0", "P1", "P2", "P3"],
  channelStatus: ["待处理", "等待回复", "已回复", "有风险", "已完成", "仅参考"],
  channelPriority: ["高", "中", "低"],
  channelName: ["BBY", "NATM", "GMA", "Other"],
  knowledgeStatus: ["待处理", "等待回复", "已回复", "有风险", "已完成", "仅参考"],
  knowledgePriority: ["高", "中", "低"],
  knowledgeModule: ["BBY", "NATM", "电视购物", "Shokz", "分销", "CE", "跨部门协作", "其他"],
  infoType: ["业务进展", "知识沉淀", "联系人信息", "规则机制", "数据口径", "风险提醒"],
};

const seedState = {
  activeModule: "overview",
  selected: null,
  viewMode: {
    projects: "cards",
    channels: "table",
    knowledge: "timeline",
  },
  filters: {
    query: "",
    status: "all",
    priority: "all",
    channel: "all",
    module: "all",
  },
  projects: [
    {
      id: "p001",
      name: "BBY 每周销售网页报告",
      category: "复盘",
      status: "进行中",
      priority: "P0",
      progress: 65,
      owner: "Raymond",
      nextAction: "确认最新 Google Sheet 数据是否已更新到上周完整周期",
      dueDate: "2026-06-14",
      lastUpdate: "2026-06-11",
      blocker: "",
      relatedChannel: "Google Sheet / 本地网页",
      tags: ["BBY", "周报", "销售分析"],
      notes: "每周固定产出，需关注销售趋势、库存和异常 SKU。",
    },
    {
      id: "p002",
      name: "NATM 四渠道销售看板刷新",
      category: "工作",
      status: "等待他人",
      priority: "P1",
      progress: 40,
      owner: "Raymond",
      nextAction: "等待 NFM 和 Abt 最新 sell-through 文件",
      dueDate: "2026-06-17",
      lastUpdate: "2026-06-10",
      blocker: "部分渠道数据未到齐",
      relatedChannel: "邮件 / Excel",
      tags: ["NATM", "NFM", "Abt", "BSM", "RCW"],
      notes: "数据到齐后刷新 dashboard，并检查 SKU 映射。",
    },
    {
      id: "p003",
      name: "每日新信息与知识记录网页",
      category: "自动化",
      status: "进行中",
      priority: "P1",
      progress: 75,
      owner: "Raymond",
      nextAction: "补齐项目管理模块并接入首页摘要",
      dueDate: "2026-06-13",
      lastUpdate: "2026-06-11",
      blocker: "",
      relatedChannel: "本地文件",
      tags: ["个人工作台", "知识管理", "静态网页"],
      notes: "统一管理记录、项目和待办。",
    },
    {
      id: "p004",
      name: "GMA TV Shopping 销售结算跟进",
      category: "工作",
      status: "有风险",
      priority: "P0",
      progress: 55,
      owner: "Raymond",
      nextAction: "核对净销售额、首付款和退货预留口径",
      dueDate: "2026-06-12",
      lastUpdate: "2026-06-11",
      blocker: "结算口径需要再次确认",
      relatedChannel: "邮件 / Excel",
      tags: ["GMA", "Finance", "结算"],
      notes: "需保证发给 finance 的数字口径一致。",
    },
  ],
  channels: [
    {
      id: "c001",
      channel: "BBY",
      subChannel: "Best Buy",
      project: "35K 2ft new inline POP",
      title: "确认 2ft POP 新陈列物料是否已进入 BBY 执行排期",
      status: "等待回复",
      priority: "高",
      owner: "Raymond",
      counterparty: "BBY / ActionLink",
      product: "OpenRun Pro 2",
      businessValue: "35K / 2ft POP",
      lastUpdateDate: "2026-06-10",
      nextAction: "跟进 BBY / ActionLink 是否确认门店执行窗口",
      dueDate: "2026-06-14",
      source: "邮件",
      sourceRef: "BBY POP execution follow-up",
      riskNote: "",
      notes: "需要确认门店执行时间和照片回传节奏。",
    },
    {
      id: "c002",
      channel: "BBY",
      subChannel: "Best Buy",
      project: "8/23 NCE",
      title: "NCE 活动 SKU、价格、库存准备情况确认",
      status: "待处理",
      priority: "高",
      owner: "Raymond",
      counterparty: "Internal / BBY",
      product: "OpenFit / OpenRun",
      businessValue: "促销 SKU 与库存",
      lastUpdateDate: "2026-06-11",
      nextAction: "汇总 SKU list、促销价、可用库存并发给内部确认",
      dueDate: "2026-06-17",
      source: "手动添加",
      sourceRef: "NCE prep list",
      riskNote: "",
      notes: "活动准备需要提前卡促销价与可用库存。",
    },
    {
      id: "c003",
      channel: "NATM",
      subChannel: "Abt",
      project: "Abt Weekly Review",
      title: "Abt 本周销售与库存异常复核",
      status: "有风险",
      priority: "高",
      owner: "Raymond",
      counterparty: "Abt",
      product: "S803 / OpenFit",
      businessValue: "sell-out 与库存差异",
      lastUpdateDate: "2026-06-10",
      nextAction: "对比 Abt sell-out 与库存表，确认是否需要补货或调整 forecast",
      dueDate: "2026-06-13",
      source: "Excel",
      sourceRef: "Abt sell-through file",
      riskNote: "销量和库存表存在差异，可能影响 forecast。",
      notes: "先保留 Abt 原始口径，再做内部解释。",
    },
    {
      id: "c004",
      channel: "NATM",
      subChannel: "NFM",
      project: "NFM POP",
      title: "NFM POP / 店面展示更新跟进",
      status: "已回复",
      priority: "中",
      owner: "Raymond",
      counterparty: "NFM",
      product: "OpenRun Pro 2",
      businessValue: "POP 安装照片",
      lastUpdateDate: "2026-06-09",
      nextAction: "等待 NFM 反馈安装照片，收到后归档",
      dueDate: "2026-06-18",
      source: "邮件",
      sourceRef: "NFM POP update",
      riskNote: "",
      notes: "照片收到后归入渠道素材记录。",
    },
    {
      id: "c005",
      channel: "GMA",
      subChannel: "GMA TV",
      project: "S803 Sales Report",
      title: "GMA TV shopping S803 销售、退货、revenue share 核算",
      status: "待处理",
      priority: "高",
      owner: "Raymond",
      counterparty: "GMA Finance",
      product: "S803",
      businessValue: "net sales / initial payment",
      lastUpdateDate: "2026-06-11",
      nextAction: "根据最新订单表计算净销售额与首付款金额",
      dueDate: "2026-06-12",
      source: "Excel / 邮件",
      sourceRef: "GMA S803 sales summary",
      riskNote: "结算口径需和 finance 保持一致。",
      notes: "付款确认邮件需要数字干净、口径统一。",
    },
  ],
  knowledge: [
    {
      id: "k001",
      dateTime: "2026-06-10 09:35",
      sourceType: "email_json",
      sourceRef: "BBY POP execution follow-up",
      module: "BBY",
      project: "ActionLink / 巡店执行",
      title: "2ft POP 门店执行反馈",
      summary: "ActionLink 已回传部分门店照片，发现 3 家门店 POP 摆放位置不符合要求，需要继续追踪整改照片。",
      originalText: "ActionLink photo check shows several stores did not place POP materials as requested. Need updated pictures after correction.",
      infoType: "业务进展",
      status: "待处理",
      owner: "Raymond",
      counterparty: "ActionLink",
      nextAction: "汇总异常门店并发给对接人确认整改时间",
      dueDate: "2026-06-13",
      tags: ["BBY", "POP", "门店", "照片"],
      priority: "高",
      isPinned: false,
      updatedAt: "2026-06-10",
    },
    {
      id: "k002",
      dateTime: "2026-06-10 11:20",
      sourceType: "email_json",
      sourceRef: "Abt weekly sales data",
      module: "NATM",
      project: "Abt",
      title: "Abt 销售数据口径确认",
      summary: "Abt 本周销量与内部表存在差异，主要疑似来自退货入账时间不同；需保留 Abt 原始口径并在周报中单独备注。",
      originalText: "Abt weekly sales numbers differ from internal tracker. Return timing may explain the gap.",
      infoType: "数据口径",
      status: "等待回复",
      owner: "Raymond",
      counterparty: "Abt",
      nextAction: "等 Abt 确认退货口径",
      dueDate: "2026-06-14",
      tags: ["NATM", "Abt", "退货", "口径"],
      priority: "中",
      isPinned: true,
      updatedAt: "2026-06-10",
    },
    {
      id: "k003",
      dateTime: "2026-06-10 14:05",
      sourceType: "manual",
      sourceRef: "GMA 付款确认草稿",
      module: "电视购物",
      project: "GMA",
      title: "GMA 付款金额确认",
      summary: "本期 GMA 销售已完成初步核算，需向 finance 确认 net sales、initial payment 与 revenue share 计算方式。",
      originalText: "Need final confirmation before sending finance payment email.",
      infoType: "业务进展",
      status: "待处理",
      owner: "Raymond",
      counterparty: "GMA / Finance",
      nextAction: "起草付款确认邮件",
      dueDate: "2026-06-12",
      tags: ["GMA", "Finance", "revenue share"],
      priority: "高",
      isPinned: false,
      updatedAt: "2026-06-10",
    },
    {
      id: "k004",
      dateTime: "2026-06-09 16:40",
      sourceType: "daily_docx",
      sourceRef: "2026-06-09-工作-信息与知识.docx",
      module: "Shokz",
      project: "联系人信息",
      title: "新增美国办公室联系人",
      summary: "记录一名新联系人及其负责范围，可用于后续美国本地办公室、渠道支持、物流协调等事项。",
      originalText: "联系人负责本地办公室协调与渠道支持。",
      infoType: "联系人信息",
      status: "仅参考",
      owner: "Raymond",
      counterparty: "US Office",
      nextAction: "",
      dueDate: "",
      tags: ["联系人", "美国办公室", "协作"],
      priority: "低",
      isPinned: true,
      updatedAt: "2026-06-09",
    },
    {
      id: "k005",
      dateTime: "2026-06-08 18:15",
      sourceType: "daily_docx",
      sourceRef: "2026-06-08-工作-信息与知识.docx",
      module: "跨部门协作",
      project: "费用归属 / 成本分摊",
      title: "POP 费用归属规则",
      summary: "BBY POP 相关费用需要按项目归属，涉及销售、市场、财务三方确认；后续复盘时需引用同一口径。",
      originalText: "POP expense ownership should be confirmed with Sales, Marketing, and Finance before recap.",
      infoType: "规则机制",
      status: "有风险",
      owner: "Raymond",
      counterparty: "Sales / Marketing / Finance",
      nextAction: "确认费用 owner 和最终归属部门",
      dueDate: "2026-06-15",
      tags: ["POP", "费用", "口径", "跨部门"],
      priority: "高",
      isPinned: true,
      updatedAt: "2026-06-08",
    },
  ],
};

let state = loadState();
let dialogMode = { type: "create", module: "projects", id: null };
let toastTimer = null;

const elements = {
  moduleNav: document.querySelector("#moduleNav"),
  pulseStack: document.querySelector("#pulseStack"),
  todayStamp: document.querySelector("#todayStamp"),
  pageTitle: document.querySelector("#pageTitle"),
  globalSearch: document.querySelector("#globalSearch"),
  resetDataBtn: document.querySelector("#resetDataBtn"),
  openCreateBtn: document.querySelector("#openCreateBtn"),
  overviewStrip: document.querySelector("#overviewStrip"),
  contentPanel: document.querySelector("#contentPanel"),
  detailPanel: document.querySelector("#detailPanel"),
  dialog: document.querySelector("#recordDialog"),
  form: document.querySelector("#recordForm"),
  formFields: document.querySelector("#formFields"),
  dialogEyebrow: document.querySelector("#dialogEyebrow"),
  dialogTitle: document.querySelector("#dialogTitle"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  cancelDialogBtn: document.querySelector("#cancelDialogBtn"),
  deleteRecordBtn: document.querySelector("#deleteRecordBtn"),
  toast: document.querySelector("#toast"),
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(seedState);
  try {
    const parsed = JSON.parse(stored);
    return {
      ...structuredClone(seedState),
      ...parsed,
      filters: { ...seedState.filters, ...parsed.filters },
      viewMode: { ...seedState.viewMode, ...parsed.viewMode },
    };
  } catch {
    return structuredClone(seedState);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  elements.todayStamp.textContent = formatToday();
  elements.pageTitle.textContent = modules[state.activeModule].label;
  elements.globalSearch.value = state.filters.query;
  renderNav();
  renderPulse();
  renderMetrics();
  renderContent();
  renderDetail();
  refreshIcons();
}

function renderNav() {
  const counts = {
    overview: openRecords().length,
    projects: state.projects.filter((item) => item.status !== "已完成").length,
    channels: state.channels.filter((item) => item.status !== "已完成").length,
    knowledge: state.knowledge.length,
  };

  elements.moduleNav.innerHTML = Object.entries(modules)
    .map(
      ([key, module]) => `
        <button class="module-button" type="button" data-module="${key}" aria-current="${state.activeModule === key ? "page" : "false"}">
          <span class="module-icon"><i data-lucide="${module.icon}" aria-hidden="true"></i></span>
          <span>
            <span class="module-label">${module.label}</span>
            <span class="module-sub">${module.sub}</span>
          </span>
          <span class="module-count">${counts[key]}</span>
        </button>
      `,
    )
    .join("");
}

function renderPulse() {
  const risk = riskItems().length;
  const due = dueSoonItems().length;
  const waiting = openRecords().filter((item) => getItemStatus(item).includes("等待")).length;

  elements.pulseStack.innerHTML = `
    <div class="pulse-item"><strong>${risk}</strong><span>风险与阻塞</span></div>
    <div class="pulse-item"><strong>${due}</strong><span>3 天内到期</span></div>
    <div class="pulse-item"><strong>${waiting}</strong><span>等待对方回复</span></div>
  `;
}

function renderMetrics() {
  const metrics = getMetrics();
  elements.overviewStrip.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card ${metric.tone || ""}">
          <div class="metric-title">
            <i data-lucide="${metric.icon}" aria-hidden="true"></i>
            <span>${metric.label}</span>
          </div>
          <strong>${metric.value}</strong>
          <span>${metric.caption}</span>
        </article>
      `,
    )
    .join("");
}

function getMetrics() {
  const activeProjects = state.projects.filter((item) => item.status !== "已完成");
  const openChannel = state.channels.filter((item) => !["已完成", "仅参考"].includes(item.status));
  const openKnowledge = state.knowledge.filter((item) => !["已完成", "仅参考"].includes(item.status));
  const risk = riskItems();
  const due = dueSoonItems();

  if (state.activeModule === "projects") {
    return [
      metric("进行中", activeProjects.filter((item) => item.status === "进行中").length, "还在推进的项目", "folder-kanban", "is-primary"),
      metric("高优先级", activeProjects.filter((item) => ["P0", "P1"].includes(item.priority)).length, "P0 / P1 未完成", "flag", "is-accent"),
      metric("即将到期", state.projects.filter(isDueSoon).length, "3 天内需要推进", "calendar-clock", "is-danger"),
      metric("等待他人", state.projects.filter((item) => item.status === "等待他人").length, "需要 follow-up", "message-square-more"),
    ];
  }

  if (state.activeModule === "channels") {
    return [
      metric("活跃渠道", new Set(openChannel.map((item) => item.channel)).size, "仍有事项未关闭", "network", "is-primary"),
      metric("待处理", state.channels.filter((item) => item.status === "待处理").length, "需要主动推进", "list-checks", "is-accent"),
      metric("等待回复", state.channels.filter((item) => item.status === "等待回复").length, "超过 3 天需提醒", "mail-question"),
      metric("风险事项", state.channels.filter((item) => item.status === "有风险").length, "渠道层面异常", "triangle-alert", "is-danger"),
    ];
  }

  if (state.activeModule === "knowledge") {
    return [
      metric("记录总数", state.knowledge.length, "已纳入工作台", "library-big", "is-primary"),
      metric("待处理", openKnowledge.length, "含待处理与等待回复", "inbox", "is-accent"),
      metric("置顶知识", state.knowledge.filter((item) => item.isPinned).length, "规则与关键口径", "pin"),
      metric("风险信息", state.knowledge.filter((item) => item.status === "有风险").length, "需要确认口径", "triangle-alert", "is-danger"),
    ];
  }

  return [
    metric("开放事项", openRecords().length, "项目、渠道、知识待推进", "radar", "is-primary"),
    metric("风险/阻塞", risk.length, "需要优先处理", "triangle-alert", "is-danger"),
    metric("临近截止", due.length, "3 天内到期", "calendar-clock", "is-accent"),
    metric("知识记录", state.knowledge.length, "可检索信息资产", "book-open-check"),
  ];
}

function metric(label, value, caption, icon, tone = "") {
  return { label, value, caption, icon, tone };
}

function renderContent() {
  if (state.activeModule === "overview") {
    renderOverview();
    return;
  }
  if (state.activeModule === "projects") renderProjects();
  if (state.activeModule === "channels") renderChannels();
  if (state.activeModule === "knowledge") renderKnowledge();
}

function renderOverview() {
  const focusItems = [
    ...state.projects.map((item) => ({ module: "projects", title: item.name, status: item.status, dueDate: item.dueDate, action: item.nextAction, priority: item.priority, id: item.id })),
    ...state.channels.map((item) => ({ module: "channels", title: item.title, status: item.status, dueDate: item.dueDate, action: item.nextAction, priority: item.priority, id: item.id })),
    ...state.knowledge.map((item) => ({ module: "knowledge", title: item.title, status: item.status, dueDate: item.dueDate, action: item.nextAction, priority: item.priority, id: item.id })),
  ]
    .filter((item) => item.action && !["已完成", "仅参考"].includes(item.status))
    .sort((a, b) => scoreItem(b) - scoreItem(a))
    .slice(0, 6);

  const updatedProjects = [...new Set(state.knowledge.map((item) => item.project).filter(Boolean))].slice(0, 5);

  elements.contentPanel.innerHTML = `
    <div class="section-head">
      <div>
        <h3>统一工作台</h3>
        <p>按项目、渠道、知识三条线收束事项，首页只保留今天最该看的动作。</p>
      </div>
      <button class="ghost-button" type="button" data-action="open-create" data-module="projects">
        <i data-lucide="plus" aria-hidden="true"></i>
        <span>录入事项</span>
      </button>
    </div>

    ${renderOverviewModuleLinks()}

    <div class="map-board">
      <div class="focus-lane" aria-label="模块流转图">
        ${laneNode("folder-kanban", "项目管理", `${state.projects.filter((item) => item.status !== "已完成").length} 个开放项目`)}
        ${laneNode("network", "渠道管理", `${state.channels.filter((item) => item.status !== "已完成").length} 条渠道事项`)}
        ${laneNode("library-big", "知识与信息", `${state.knowledge.length} 条可检索记录`)}
      </div>
      <div class="task-stack">
        <h3>今日推进</h3>
        ${focusItems.length ? focusItems.map(renderTaskItem).join("") : `<div class="empty-state">今天没有必须推进的事项</div>`}
      </div>
    </div>

    <div class="toolbar" style="margin-top:16px">
      ${updatedProjects.map((name) => `<button class="chip-button" type="button" data-search="${escapeAttr(name)}">${escapeHTML(name)}</button>`).join("")}
    </div>
  `;
}

function laneNode(icon, label, value) {
  return `
    <div class="lane-node">
      <span class="lane-icon"><i data-lucide="${icon}" aria-hidden="true"></i></span>
      <span><strong>${label}</strong><span>${value}</span></span>
    </div>
  `;
}

function renderOverviewModuleLinks() {
  const groups = [
    {
      key: "projects",
      title: "项目管理",
      summary: "在线项目管理主控台",
      links: moduleLinks.overview.filter((link) => link.module === "projects"),
    },
    {
      key: "channels",
      title: "渠道管理",
      summary: "NATM 与电视购物渠道入口",
      links: moduleLinks.overview.filter((link) => link.module === "channels"),
    },
    {
      key: "knowledge",
      title: "知识与信息",
      summary: "每日记录与信息沉淀入口",
      links: moduleLinks.overview.filter((link) => link.module === "knowledge"),
    },
  ];

  return `
    <section class="overview-link-groups" aria-label="模块入口">
      ${groups
        .map(
          (group) => `
            <section class="overview-link-group overview-link-group-${group.key}">
              <div class="overview-link-heading">
                <span class="overview-link-icon"><i data-lucide="${modules[group.key].icon}" aria-hidden="true"></i></span>
                <div>
                  <h4>${escapeHTML(group.title)}</h4>
                  <p>${escapeHTML(group.summary)}</p>
                </div>
              </div>
              <div class="link-card-grid overview-link-card-grid">
                ${group.links.map(renderLinkCard).join("")}
              </div>
            </section>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderModuleLinks(module) {
  const links = moduleLinks[module] || [];
  if (!links.length) return "";
  return `
    <section class="module-link-section" aria-label="${escapeAttr(modules[module]?.label || "模块入口")}">
      <div class="link-card-grid">
        ${links.map(renderLinkCard).join("")}
      </div>
    </section>
  `;
}

function renderLinkCard(link) {
  return `
    <a class="link-card link-card-${link.module}" href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">
      <span class="link-card-icon"><i data-lucide="${link.icon}" aria-hidden="true"></i></span>
      <span class="link-card-copy">
        <span class="link-card-kicker">${escapeHTML(link.badge)}</span>
        <strong>${escapeHTML(link.title)}</strong>
        <span>${escapeHTML(link.caption)}</span>
      </span>
      <span class="link-card-action" aria-hidden="true"><i data-lucide="arrow-up-right"></i></span>
    </a>
  `;
}

function renderTaskItem(item) {
  return `
    <button class="task-item module-button" type="button" data-open="${item.module}:${item.id}">
      <span class="module-icon"><i data-lucide="${modules[item.module].icon}" aria-hidden="true"></i></span>
      <span>
        <strong>${escapeHTML(item.title)}</strong>
        <span>${escapeHTML(item.action)} · ${escapeHTML(item.dueDate || "无截止日")}</span>
      </span>
      <span class="status-pill ${statusClass(item.status)}">${escapeHTML(item.status)}</span>
    </button>
  `;
}

function renderProjects() {
  const items = filterItems(state.projects, "projects");
  elements.contentPanel.innerHTML = `
    ${moduleHead("项目推进表", "跟踪状态、优先级、进度、下一步动作和阻塞点。", "projects")}
    ${renderModuleLinks("projects")}
    ${moduleToolbar("projects")}
    ${
      state.viewMode.projects === "cards"
        ? `<div class="grid-list">${items.map(renderProjectCard).join("") || emptyState("没有匹配的项目")}</div>`
        : renderProjectTable(items)
    }
  `;
}

function renderProjectCard(item) {
  return `
    <article class="record-card ${isSelected("projects", item.id) ? "is-selected" : ""}">
      <div class="record-topline">
        <span class="status-pill ${statusClass(item.status)}">${escapeHTML(item.status)}</span>
        <span class="priority-pill">${escapeHTML(item.priority)}</span>
      </div>
      <button class="mini-title" type="button" data-open="projects:${item.id}">
        <span class="record-title">${escapeHTML(item.name)}</span>
      </button>
      <p class="record-summary">${escapeHTML(item.nextAction)}</p>
      ${progressLine(item.progress)}
      <div class="tag-row">${renderTags(item.tags)}</div>
      <div class="record-actions">
        ${statusSelect("projects", item.id, item.status, optionSets.projectStatus)}
        <button class="mini-button" type="button" data-edit="projects:${item.id}" title="编辑" aria-label="编辑 ${escapeAttr(item.name)}"><i data-lucide="square-pen" aria-hidden="true"></i></button>
        <span class="due-pill">${dueLabel(item.dueDate)}</span>
      </div>
    </article>
  `;
}

function renderProjectTable(items) {
  if (!items.length) return emptyState("没有匹配的项目");
  return `
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr><th>项目</th><th>状态</th><th>优先级</th><th>进度</th><th>下一步</th><th>截止日</th><th>操作</th></tr></thead>
        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td><button class="mini-link" type="button" data-open="projects:${item.id}">${escapeHTML(item.name)}</button><br><span class="muted">${escapeHTML(item.category)}</span></td>
                  <td>${statusSelect("projects", item.id, item.status, optionSets.projectStatus)}</td>
                  <td><span class="priority-pill">${escapeHTML(item.priority)}</span></td>
                  <td>${progressLine(item.progress)}</td>
                  <td>${escapeHTML(item.nextAction)}</td>
                  <td>${dueLabel(item.dueDate)}</td>
                  <td><button class="mini-button" type="button" data-edit="projects:${item.id}" title="编辑" aria-label="编辑 ${escapeAttr(item.name)}"><i data-lucide="square-pen" aria-hidden="true"></i></button></td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderChannels() {
  const items = filterItems(state.channels, "channels");
  const groups = groupBy(items, "channel");
  const ordered = ["BBY", "NATM", "GMA", "Other"].filter((key) => groups[key]?.length);

  elements.contentPanel.innerHTML = `
    ${moduleHead("渠道作战表", "按渠道聚合待处理、等待回复、风险事项和下一步动作。", "channels")}
    ${renderModuleLinks("channels")}
    ${moduleToolbar("channels")}
    <div class="channel-group">
      ${
        ordered.length
          ? ordered.map((channel) => renderChannelGroup(channel, groups[channel])).join("")
          : emptyState("没有匹配的渠道事项")
      }
    </div>
  `;
}

function renderChannelGroup(channel, items) {
  return `
    <section>
      <div class="group-header">
        <strong>${escapeHTML(channel)}</strong>
        <span class="due-pill">${items.filter((item) => item.status !== "已完成").length} 条开放</span>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>事项</th><th>子渠道</th><th>状态</th><th>优先级</th><th>下一步</th><th>截止日</th><th>来源</th></tr></thead>
          <tbody>
            ${items
              .map(
                (item) => `
                  <tr>
                    <td><button class="mini-link" type="button" data-open="channels:${item.id}">${escapeHTML(item.title)}</button><br><span class="muted">${escapeHTML(item.project)}</span></td>
                    <td>${escapeHTML(item.subChannel)}</td>
                    <td>${statusSelect("channels", item.id, item.status, optionSets.channelStatus)}</td>
                    <td><span class="priority-pill">${escapeHTML(item.priority)}</span></td>
                    <td>${escapeHTML(item.nextAction)}</td>
                    <td>${dueLabel(item.dueDate)}</td>
                    <td>${escapeHTML(item.source)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderKnowledge() {
  const items = filterItems(state.knowledge, "knowledge").sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || b.dateTime.localeCompare(a.dateTime));

  elements.contentPanel.innerHTML = `
    ${moduleHead("知识与信息台", "将每日 docx、邮件 JSON、网页摘要沉淀为可检索记录。", "knowledge")}
    ${renderModuleLinks("knowledge")}
    ${moduleToolbar("knowledge")}
    <div class="knowledge-list">
      ${items.map(renderKnowledgeItem).join("") || emptyState("没有匹配的知识记录")}
    </div>
  `;
}

function renderKnowledgeItem(item) {
  return `
    <article class="knowledge-item ${item.isPinned ? "is-pinned" : ""}">
      <div class="knowledge-meta">
        <span>${escapeHTML(item.dateTime)}</span>
        <span>${escapeHTML(item.module)}</span>
        <span>${escapeHTML(item.infoType)}</span>
        ${item.isPinned ? "<span>PINNED</span>" : ""}
      </div>
      <div class="record-topline">
        <button class="mini-title" type="button" data-open="knowledge:${item.id}">
          <span class="record-title">${escapeHTML(item.title)}</span>
        </button>
        <span class="status-pill ${statusClass(item.status)}">${escapeHTML(item.status)}</span>
      </div>
      <p class="record-summary">${escapeHTML(item.summary)}</p>
      <div class="tag-row">${renderTags(item.tags)}</div>
      <details class="original-text">
        <summary>来源与原文</summary>
        <p>${escapeHTML(item.sourceRef)}：${escapeHTML(item.originalText)}</p>
      </details>
      <div class="record-actions">
        ${statusSelect("knowledge", item.id, item.status, optionSets.knowledgeStatus)}
        <button class="mini-button" type="button" data-pin="${item.id}" title="置顶切换" aria-label="置顶切换 ${escapeAttr(item.title)}"><i data-lucide="${item.isPinned ? "pin-off" : "pin"}" aria-hidden="true"></i></button>
        <button class="mini-button" type="button" data-edit="knowledge:${item.id}" title="编辑" aria-label="编辑 ${escapeAttr(item.title)}"><i data-lucide="square-pen" aria-hidden="true"></i></button>
      </div>
    </article>
  `;
}

function moduleHead(title, subtitle, module) {
  return `
    <div class="section-head">
      <div>
        <h3>${title}</h3>
        <p>${subtitle}</p>
      </div>
      <button class="ghost-button" type="button" data-action="open-create" data-module="${module}">
        <i data-lucide="plus" aria-hidden="true"></i>
        <span>新增</span>
      </button>
    </div>
  `;
}

function moduleToolbar(module) {
  const filters = [];
  filters.push(selectFilter("status", "状态", getStatusOptions(module)));
  if (module === "projects") filters.push(selectFilter("priority", "优先级", optionSets.projectPriority));
  if (module === "channels") {
    filters.push(selectFilter("priority", "优先级", optionSets.channelPriority));
    filters.push(selectFilter("channel", "渠道", optionSets.channelName));
  }
  if (module === "knowledge") {
    filters.push(selectFilter("priority", "优先级", optionSets.knowledgePriority));
    filters.push(selectFilter("module", "模块", optionSets.knowledgeModule));
  }

  const modes = {
    projects: [
      ["cards", "layout-grid"],
      ["table", "table-2"],
    ],
    channels: [["table", "table-2"]],
    knowledge: [["timeline", "list-tree"]],
  }[module];

  return `
    <div class="toolbar">
      ${filters.join("")}
      <div class="segmented-control" aria-label="视图模式">
        ${modes
          .map(
            ([mode, icon]) => `
              <button type="button" data-view="${module}:${mode}" aria-pressed="${state.viewMode[module] === mode}" title="${mode}" aria-label="${mode}">
                <i data-lucide="${icon}" aria-hidden="true"></i>
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function selectFilter(name, label, options) {
  return `
    <label>
      <span class="sr-only">${label}</span>
      <select class="filter-select" data-filter="${name}">
        <option value="all">${label}: 全部</option>
        ${options.map((option) => `<option value="${escapeAttr(option)}" ${state.filters[name] === option ? "selected" : ""}>${escapeHTML(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function getStatusOptions(module) {
  if (module === "projects") return optionSets.projectStatus;
  if (module === "channels") return optionSets.channelStatus;
  return optionSets.knowledgeStatus;
}

function renderDetail() {
  if (!state.selected) {
    elements.detailPanel.innerHTML = `
      <div class="detail-empty">
        <div>
          <i data-lucide="panel-right-open" aria-hidden="true"></i>
          <p>选择一条记录查看详情</p>
        </div>
      </div>
    `;
    return;
  }

  const { module, id } = state.selected;
  const item = state[module].find((record) => record.id === id);
  if (!item) {
    state.selected = null;
    renderDetail();
    return;
  }

  elements.detailPanel.innerHTML = `
    <div class="detail-content">
      <div class="section-head">
        <div>
          <p class="eyebrow">${modules[module].label}</p>
          <h3>${escapeHTML(getItemTitle(item))}</h3>
        </div>
        <button class="icon-button" type="button" data-edit="${module}:${id}" title="编辑" aria-label="编辑">
          <i data-lucide="square-pen" aria-hidden="true"></i>
        </button>
      </div>
      <div class="tag-row">
        <span class="status-pill ${statusClass(getItemStatus(item))}">${escapeHTML(getItemStatus(item))}</span>
        <span class="priority-pill">${escapeHTML(item.priority || item.category || "普通")}</span>
        ${item.dueDate ? `<span class="due-pill">${dueLabel(item.dueDate)}</span>` : ""}
      </div>
      <dl class="detail-kv">
        ${detailRows(module, item)}
      </dl>
    </div>
  `;
}

function detailRows(module, item) {
  const rows =
    module === "projects"
      ? [
          ["下一步", item.nextAction],
          ["阻塞点", item.blocker || "无"],
          ["关联渠道", item.relatedChannel],
          ["负责人", item.owner],
          ["最近更新", item.lastUpdate],
          ["备注", item.notes],
        ]
      : module === "channels"
        ? [
            ["项目", item.project],
            ["下一步", item.nextAction],
            ["对方", item.counterparty],
            ["产品 / 价值", `${item.product} / ${item.businessValue}`],
            ["风险", item.riskNote || "无"],
            ["来源", `${item.source} · ${item.sourceRef}`],
          ]
        : [
            ["摘要", item.summary],
            ["下一步", item.nextAction || "无"],
            ["项目", item.project],
            ["来源", `${item.sourceType} · ${item.sourceRef}`],
            ["原文", item.originalText],
            ["更新时间", item.updatedAt],
          ];

  return rows
    .map(
      ([key, value]) => `
        <div>
          <dt>${escapeHTML(key)}</dt>
          <dd>${escapeHTML(String(value || ""))}</dd>
        </div>
      `,
    )
    .join("");
}

function openDialog(module = getWritableModule(), id = null) {
  const item = id ? state[module].find((record) => record.id === id) : null;
  dialogMode = { type: id ? "edit" : "create", module, id };
  elements.dialogEyebrow.textContent = modules[module].label;
  elements.dialogTitle.textContent = id ? "编辑记录" : "新增记录";
  elements.deleteRecordBtn.hidden = !id;
  elements.formFields.innerHTML = getFormFields(module, item).map(renderField).join("");
  elements.dialog.showModal();
  refreshIcons();
}

function getFormFields(module, item) {
  if (module === "projects") {
    return [
      field("name", "项目名称", "text", item?.name),
      field("category", "分类", "text", item?.category || "工作"),
      field("status", "状态", "select", item?.status || "进行中", optionSets.projectStatus),
      field("priority", "优先级", "select", item?.priority || "P1", optionSets.projectPriority),
      field("progress", "进度", "number", item?.progress ?? 0),
      field("owner", "负责人", "text", item?.owner || "Raymond"),
      field("dueDate", "截止日期", "date", item?.dueDate),
      field("lastUpdate", "最近更新", "date", item?.lastUpdate || todayISO()),
      field("relatedChannel", "关联渠道", "text", item?.relatedChannel),
      field("tags", "标签", "text", (item?.tags || []).join(", ")),
      field("nextAction", "下一步动作", "textarea", item?.nextAction, null, true),
      field("blocker", "阻塞点", "textarea", item?.blocker, null, true),
      field("notes", "备注", "textarea", item?.notes, null, true),
    ];
  }

  if (module === "channels") {
    return [
      field("channel", "渠道", "select", item?.channel || "BBY", optionSets.channelName),
      field("subChannel", "子渠道", "text", item?.subChannel),
      field("project", "项目/主题", "text", item?.project),
      field("status", "状态", "select", item?.status || "待处理", optionSets.channelStatus),
      field("priority", "优先级", "select", item?.priority || "中", optionSets.channelPriority),
      field("owner", "负责人", "text", item?.owner || "Raymond"),
      field("counterparty", "对方联系人/团队", "text", item?.counterparty),
      field("product", "产品", "text", item?.product),
      field("businessValue", "业务价值", "text", item?.businessValue),
      field("dueDate", "截止日期", "date", item?.dueDate),
      field("lastUpdateDate", "最近更新", "date", item?.lastUpdateDate || todayISO()),
      field("source", "来源", "text", item?.source || "手动添加"),
      field("sourceRef", "来源引用", "text", item?.sourceRef, null, true),
      field("title", "事项标题", "textarea", item?.title, null, true),
      field("nextAction", "下一步动作", "textarea", item?.nextAction, null, true),
      field("riskNote", "风险说明", "textarea", item?.riskNote, null, true),
      field("notes", "备注", "textarea", item?.notes, null, true),
    ];
  }

  return [
    field("dateTime", "发生时间", "text", item?.dateTime || `${todayISO()} 09:00`),
    field("sourceType", "来源类型", "select", item?.sourceType || "manual", ["daily_docx", "email_json", "manual", "web_summary"]),
    field("sourceRef", "来源引用", "text", item?.sourceRef),
    field("module", "模块", "select", item?.module || "BBY", optionSets.knowledgeModule),
    field("project", "项目/渠道", "text", item?.project),
    field("infoType", "信息类型", "select", item?.infoType || "业务进展", optionSets.infoType),
    field("status", "状态", "select", item?.status || "待处理", optionSets.knowledgeStatus),
    field("priority", "优先级", "select", item?.priority || "中", optionSets.knowledgePriority),
    field("owner", "负责人", "text", item?.owner || "Raymond"),
    field("counterparty", "相关对象", "text", item?.counterparty),
    field("dueDate", "截止日期", "date", item?.dueDate),
    field("tags", "标签", "text", (item?.tags || []).join(", ")),
    field("isPinned", "置顶", "select", item?.isPinned ? "true" : "false", ["true", "false"]),
    field("title", "标题", "textarea", item?.title, null, true),
    field("summary", "摘要", "textarea", item?.summary, null, true),
    field("originalText", "原文", "textarea", item?.originalText, null, true),
    field("nextAction", "下一步动作", "textarea", item?.nextAction, null, true),
  ];
}

function field(name, label, type, value = "", options = null, wide = false) {
  return { name, label, type, value: value ?? "", options, wide };
}

function renderField(config) {
  const id = `field-${config.name}`;
  const value = escapeAttr(config.value);
  let control = "";
  if (config.type === "select") {
    control = `
      <select id="${id}" name="${config.name}">
        ${config.options.map((option) => `<option value="${escapeAttr(option)}" ${String(config.value) === String(option) ? "selected" : ""}>${escapeHTML(option)}</option>`).join("")}
      </select>
    `;
  } else if (config.type === "textarea") {
    control = `<textarea id="${id}" name="${config.name}">${escapeHTML(config.value)}</textarea>`;
  } else {
    control = `<input id="${id}" name="${config.name}" type="${config.type}" value="${value}" ${config.name === "progress" ? 'min="0" max="100"' : ""} />`;
  }

  return `
    <div class="field ${config.wide ? "span-2" : ""}">
      <label for="${id}">${config.label}</label>
      ${control}
    </div>
  `;
}

function submitDialog(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const module = dialogMode.module;
  const id = dialogMode.id || createId(module);
  const existing = dialogMode.id ? state[module].find((item) => item.id === dialogMode.id) : null;
  const next = { ...(existing || {}), id };

  for (const [key, value] of formData.entries()) {
    if (key === "tags") {
      next[key] = String(value)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    } else if (key === "progress") {
      next[key] = clamp(Number(value), 0, 100);
    } else if (key === "isPinned") {
      next[key] = value === "true";
    } else {
      next[key] = String(value).trim();
    }
  }

  if (module === "knowledge") next.updatedAt = todayISO();
  if (module === "projects") next.lastUpdate = next.lastUpdate || todayISO();
  if (module === "channels") next.lastUpdateDate = next.lastUpdateDate || todayISO();

  if (dialogMode.id) {
    state[module] = state[module].map((item) => (item.id === dialogMode.id ? next : item));
  } else {
    state[module] = [next, ...state[module]];
  }

  state.selected = { module, id };
  persist();
  elements.dialog.close();
  showToast("已保存");
  render();
}

function deleteRecord() {
  if (!dialogMode.id) return;
  const module = dialogMode.module;
  const item = state[module].find((record) => record.id === dialogMode.id);
  if (!item) return;
  const confirmed = window.confirm(`删除「${getItemTitle(item)}」？`);
  if (!confirmed) return;
  state[module] = state[module].filter((record) => record.id !== dialogMode.id);
  if (state.selected?.id === dialogMode.id) state.selected = null;
  persist();
  elements.dialog.close();
  showToast("已删除");
  render();
}

function filterItems(items, module) {
  const query = state.filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (query && !JSON.stringify(item).toLowerCase().includes(query)) return false;
    if (state.filters.status !== "all" && getItemStatus(item) !== state.filters.status) return false;
    if (state.filters.priority !== "all" && item.priority !== state.filters.priority) return false;
    if (module === "channels" && state.filters.channel !== "all" && item.channel !== state.filters.channel) return false;
    if (module === "knowledge" && state.filters.module !== "all" && item.module !== state.filters.module) return false;
    return true;
  });
}

function openRecords() {
  return [
    ...state.projects.filter((item) => item.status !== "已完成"),
    ...state.channels.filter((item) => !["已完成", "仅参考"].includes(item.status)),
    ...state.knowledge.filter((item) => !["已完成", "仅参考"].includes(item.status)),
  ];
}

function riskItems() {
  return openRecords().filter((item) => getItemStatus(item) === "有风险" || Boolean(item.blocker || item.riskNote));
}

function dueSoonItems() {
  return openRecords().filter(isDueSoon);
}

function isDueSoon(item) {
  if (!item.dueDate) return false;
  const diff = dayDiff(todayISO(), item.dueDate);
  return diff <= 3;
}

function scoreItem(item) {
  let score = 0;
  if (["P0", "高"].includes(item.priority)) score += 20;
  if (["P1", "中"].includes(item.priority)) score += 10;
  if (getItemStatus(item) === "有风险") score += 25;
  if (getItemStatus(item).includes("等待")) score += 8;
  if (isDueSoon(item)) score += 18;
  return score;
}

function getItemTitle(item) {
  return item.name || item.title || item.project || "未命名";
}

function getItemStatus(item) {
  return item.status || "待处理";
}

function getWritableModule() {
  return state.activeModule === "overview" ? "projects" : state.activeModule;
}

function isSelected(module, id) {
  return state.selected?.module === module && state.selected?.id === id;
}

function progressLine(value) {
  const numeric = clamp(Number(value) || 0, 0, 100);
  return `
    <div class="progress-line">
      <div class="progress-label"><span>Progress</span><span>${numeric}%</span></div>
      <div class="progress-track" aria-label="进度 ${numeric}%"><span class="progress-fill" style="--value:${numeric}%"></span></div>
    </div>
  `;
}

function statusSelect(module, id, value, options) {
  return `
    <label>
      <span class="sr-only">状态</span>
      <select class="status-select" data-status="${module}:${id}">
        ${options.map((option) => `<option value="${escapeAttr(option)}" ${value === option ? "selected" : ""}>${escapeHTML(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function statusClass(status) {
  if (status === "有风险") return "status-risk";
  if (status === "等待他人" || status === "等待回复") return "status-waiting";
  if (status === "已完成" || status === "已回复") return "status-done";
  return "";
}

function dueLabel(date) {
  if (!date) return "无截止日";
  const diff = dayDiff(todayISO(), date);
  if (diff < 0) return `<span class="status-pill status-overdue">逾期 ${Math.abs(diff)} 天</span>`;
  if (diff === 0) return `<span class="status-pill status-overdue">今天截止</span>`;
  if (diff <= 3) return `<span class="status-pill status-waiting">${diff} 天后</span>`;
  return `<span class="due-pill">${escapeHTML(date)}</span>`;
}

function renderTags(tags = []) {
  return tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHTML(message)}</div>`;
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const group = item[key] || "Other";
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {});
}

function dayDiff(start, end) {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  return Math.round((b - a) / 86400000);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatToday() {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
  }).format(new Date());
}

function createId(module) {
  const prefix = { projects: "p", channels: "c", knowledge: "k" }[module];
  return `${prefix}${Date.now().toString(36)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2800);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

elements.moduleNav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-module]");
  if (!button) return;
  state.activeModule = button.dataset.module;
  state.selected = null;
  persist();
  render();
});

elements.globalSearch.addEventListener("input", (event) => {
  state.filters.query = event.target.value;
  persist();
  renderContent();
  renderMetrics();
  refreshIcons();
});

elements.resetDataBtn.addEventListener("click", () => {
  const confirmed = window.confirm("恢复示例数据会清除当前浏览器里的本地修改，继续？");
  if (!confirmed) return;
  state = structuredClone(seedState);
  persist();
  showToast("已恢复示例数据");
  render();
});

elements.openCreateBtn.addEventListener("click", () => openDialog(getWritableModule()));
elements.closeDialogBtn.addEventListener("click", () => elements.dialog.close());
elements.cancelDialogBtn.addEventListener("click", () => elements.dialog.close());
elements.deleteRecordBtn.addEventListener("click", deleteRecord);
elements.form.addEventListener("submit", submitDialog);

document.addEventListener("click", (event) => {
  const createButton = event.target.closest("[data-action='open-create']");
  if (createButton) {
    openDialog(createButton.dataset.module || getWritableModule());
    return;
  }

  const openButton = event.target.closest("[data-open]");
  if (openButton) {
    const [module, id] = openButton.dataset.open.split(":");
    state.activeModule = module;
    state.selected = { module, id };
    persist();
    render();
    return;
  }

  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    const [module, id] = editButton.dataset.edit.split(":");
    openDialog(module, id);
    return;
  }

  const pinButton = event.target.closest("[data-pin]");
  if (pinButton) {
    const item = state.knowledge.find((record) => record.id === pinButton.dataset.pin);
    if (item) {
      item.isPinned = !item.isPinned;
      item.updatedAt = todayISO();
      persist();
      render();
    }
    return;
  }

  const chipButton = event.target.closest("[data-search]");
  if (chipButton) {
    state.filters.query = chipButton.dataset.search;
    persist();
    render();
  }
});

document.addEventListener("change", (event) => {
  const statusSelectEl = event.target.closest("[data-status]");
  if (statusSelectEl) {
    const [module, id] = statusSelectEl.dataset.status.split(":");
    const item = state[module].find((record) => record.id === id);
    if (item) {
      item.status = statusSelectEl.value;
      if (module === "projects") item.lastUpdate = todayISO();
      if (module === "channels") item.lastUpdateDate = todayISO();
      if (module === "knowledge") item.updatedAt = todayISO();
      persist();
      showToast("状态已更新");
      render();
    }
    return;
  }

  const filter = event.target.closest("[data-filter]");
  if (filter) {
    state.filters[filter.dataset.filter] = filter.value;
    persist();
    render();
  }
});

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (!viewButton) return;
  const [module, mode] = viewButton.dataset.view.split(":");
  state.viewMode[module] = mode;
  persist();
  render();
});

render();
