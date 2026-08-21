# Job-Management

一个静态单页个人工作台，用于统一管理：

- 项目管理
- 渠道管理
- 知识与信息管理

## 模块入口

- 项目管理：[在线项目管理页](https://abchaoming1.github.io/Project-Management/)
- 渠道管理：[NATM 渠道](https://abchaoming1.github.io/NATM/#summarySection)
- 渠道管理：[电视购物 GMA](https://abchaoming1.github.io/GMA/)
- 渠道管理：[Micro Center 渠道看板](https://abchaoming1.github.io/Job-Management/microcenter/)
- 知识与信息管理：[Everyday-Records](https://abchaoming1.github.io/Everyday-Records/)

## 使用

直接打开 `index.html` 即可使用。数据会保存在当前浏览器的 `localStorage` 中。

## 文件

- `index.html`: 页面结构
- `styles.css`: 视觉系统与响应式布局
- `app.js`: 入口链接、数据、筛选、CRUD、本地持久化
- `microcenter/`: 仅包含 MC 渠道数据的销售、月度与 SKU 看板
  - 页面启动及每 5 分钟通过 Google Visualization API 自动同步源表中的 MC 数据
  - 在线同步异常时自动回退到仓库内置数据，不影响看板打开
  - QTY 与 REV 分别识别最新完整月份，避免不同截止期混算同比和 ASP
  - 月度 × SKU 页面支持逐月 SKU 明细、同月同比及 12 个月 QTY/REV 矩阵
  - 自动合并历史数值型 REV 与新增带货币符号的文本型 REV
- `design-system/MASTER.md`: 设计系统与验收标准

## GitHub Pages

仓库根目录就是静态站点目录，可以直接用 GitHub Pages 发布。
