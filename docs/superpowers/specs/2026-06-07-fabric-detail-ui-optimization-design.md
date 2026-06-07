# 布料详情页 UI 优化设计

**日期**: 2026-06-07  
**状态**: 已批准  
**范围**: `app/(auth)/fabrics/[id]/page.tsx` + `components/FabricDetail.tsx` + CSS

## 目标

将布料详情页统一到 `animal-island-ui` 组件体系，与列表页、编辑页、统计页风格一致。

## 当前问题

- 页头使用内联样式 + 纯文字 `←` 链接，与其他页面不一致
- 编辑/删除按钮使用原生 HTML 标签 + 自定义 CSS，未使用 `Button` 组件
- 缺少统一的卡片容器包裹内容区
- 删除按钮仅一个 emoji，辨识度低

## 目标结构

```
┌─────────────────────────────────┐
│  BackHeader (布料名称)           │  ← animal-island-ui BackHeader
├─────────────────────────────────┤
│  照片区                           │  ← 大圆角卡片 (border-radius: 20px, shadow)
│  🧶 或 <img> (object-fit: cover) │
│  缩略图条 (如有 >1 张照片)        │
├─────────────────────────────────┤
│  标签条                           │  ← 粉色 pill 标签 (保持不变)
│  [状态] [类型] [幅宽] [价格]     │
├─────────────────────────────────┤
│  信息区                           │  ← 文本信息卡片
│  店铺 · xxx                      │
│  日期 · xxx                      │
│  备注 · xxx                      │
├─────────────────────────────────┤
│  [编辑 Button]  [删除 Button]     │  ← animal-island-ui Button + Icon
└─────────────────────────────────┘
```

## 组件使用

| 区域 | 组件 | 来源 |
|------|------|------|
| 页头 | `BackHeader` | `@/components/BackHeader` (animal-island-ui) |
| 内容容器 | `Card` | `animal-island-ui` |
| 编辑按钮 | `Button type="primary"` + `Icon` | `animal-island-ui` |
| 删除按钮 | `Button type="default"` + `Icon` | `animal-island-ui` |
| 标签 | 自定义 CSS pill (保持不变) | `FabricDetail.module.css` |

## 改动文件

1. **`app/(auth)/fabrics/[id]/page.tsx`** — 替换内联 header 为 `<BackHeader>`，添加外层 `minHeight`/`background` 容器
2. **`components/FabricDetail.tsx`** — 用 `Card` 包裹照片和信息区，用 `Button`+`Icon` 替换操作按钮
3. **`components/FabricDetail.module.css`** — 调整照片区为卡片式（圆角+阴影），简化/移除不再需要的操作按钮样式

## 不变内容

- 状态切换逻辑 (`toggleStatus`)
- 删除确认逻辑 (`handleDelete`)
- 标签内容与样式
- 信息列表内容与样式
- 缩略图条逻辑与样式

## 验证

- `npm run build` 无错误
- `npm test` 全部通过
- 手动检查：详情页与列表/编辑/统计页风格一致
