# Job-Management Design System

## Product Positioning

Job-Management is a personal operations dashboard for three work streams:

- 项目管理: progress, risks, deadlines, and next actions.
- 渠道管理: BBY / NATM / GMA follow-up work.
- 知识与信息管理: daily records, source references, reusable rules, and information traces.

The interface should feel like a compact command desk, not a landing page.

## Visual Direction

- Style: refined operational, dense but calm.
- Composition: left rail navigation, metric strip, main work area, persistent detail panel.
- Color: warm gray-green base with teal, amber, red, and violet semantic accents.
- Typography: `Noto Sans SC` for Chinese UI, `IBM Plex Mono` for dates, counts, and labels.
- Radius: 8px or less for cards, panels, controls.
- Motion: short 150-180ms transitions only; honor reduced motion.

## UX Rules

- Show the actual management surface as the first screen.
- Keep all primary controls at 44px minimum height.
- Use icon buttons with accessible labels and tooltips.
- Preserve visible form labels.
- Avoid nested cards and decorative-only visuals.
- Use localStorage for static-page persistence.
- Keep risk, waiting, and due-soon states visible without relying on color alone.

## Module Patterns

- Project Management: card/table switch, status quick edit, progress bar, detail panel.
- Channel Management: grouped dense table by channel, status quick edit, due/risk emphasis.
- Knowledge Management: timeline list, pinned records, source/original text disclosure.

## Verification Criteria

- Page opens directly from `index.html`.
- Records can be added, edited, deleted, filtered, selected, and persisted.
- Layout works at desktop, tablet, and mobile widths.
- No horizontal overflow on small screens.
- Buttons and inputs remain readable in Chinese.
