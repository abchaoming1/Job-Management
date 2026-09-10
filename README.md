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
  - 默认呈现**当前年份（2026）的累计表现**，月度与 SKU 明细均跟随分析年份；参考 NATM 的侧栏结构
  - 上年（2025）全年营收、销量、ASP、SKU 单独放在「上年对比」模块；另列两年相同月份的累计增减，不以今年累计直接对比去年全年
  - 页面启动、回到页面及可见时每 5 分钟读取 Google Sheet 的 XLSX 导出
  - 从「渠道数据总表」A:H 读取底层数值和公式缓存值，仅保留渠道 MC；不受列类型推断、显示格式或固定行号影响
  - 原表每行只读取一次，同月同 SKU 多行逐行累加；原始行号可回到 Google Sheet 核对
  - QTY / REV 分别核对每月完整性，空白与零分开；同比按两年相同月份计算
  - 支持完整 SKU / 基础 SKU、12 个月矩阵、单 SKU 趋势、年度汇总和 CSV 导出
  - 在线成功后保存本地快照；在线失败时保留最近快照并明确显示快照时间和错误，不显示“同步成功”
  - 内置快照通过 `python scripts/analyze_microcenter.py source.xlsx microcenter/data.js` 从原表导出生成，保留数值精度及下载时间
  - 回归检查：`node --test scripts/microcenter-data.test.cjs`（包括重复行、混合金额格式、缺失值、跨年同期和源表汇总）
  - XLSX 解压依赖本地随站点发布的 JSZip 3.10.1，许可见 `microcenter/vendor/JSZip-LICENSE.markdown`
- `design-system/MASTER.md`: 设计系统与验收标准

## GitHub Pages

仓库根目录就是静态站点目录，可以直接用 GitHub Pages 发布。
