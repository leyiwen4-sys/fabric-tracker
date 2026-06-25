# 布料首页筛选与排序功能 — 设计规格

> 日期：2026-06-25 | 状态：已批准

## 概述

在布料首页搜索栏位置增加筛选（按类型、按状态）和排序功能，使用三标签切换式 UI：搜索 / 筛选 / 排序。

## URL 查询参数

整个筛选/排序状态全部存入 URL 查询参数，与现有搜索机制一致。切换标签是纯 UI 状态，不影响 URL。

| 参数 | 说明 | 可选值 | 默认值 |
|------|------|--------|--------|
| `search` | 文本搜索（名称/店铺/备注） | 任意字符串 | 无 |
| `type` | 布料类型筛选 | 棉 / 麻 / 丝 / 毛 / 化纤 / 混纺 / 其他 | 无（全部） |
| `status` | 使用状态筛选 | idle / used / empty | 无（全部） |
| `sort` | 排序方式 | created_at_desc / created_at_asc / purchase_date_desc / purchase_date_asc / price_desc / price_asc | created_at_desc |

**URL 示例：** `/?search=碎花&type=棉&status=idle&sort=price_asc`

## UI 布局

```
┌──────────────────────────────────┐
│  [统计]   我的布记岛   [退出]     │  ← 标题栏（不变）
├──────────────────────────────────┤
│  ┌──────┬──────┬──────┐         │
│  │ 🔍搜索│ 📋筛选│ 📊排序│         │  ← Tabs 组件
│  └──────┴──────┴──────┘         │
│                                  │
│  [   搜索框 / 筛选选项 / 排序选项  ] │  ← 内容区随标签变化
│  [   当前筛选状态小灰字提示       ] │  ← 仅在筛选/排序激活时显示
├──────────────────────────────────┤
│  布料卡片网格 (FabricList)       │  ← 不变
└──────────────────────────────────┘
```

### 三个标签内容

**搜索标签（默认）：**
- 搜索输入框（与现有 SearchBar 一致）
- placeholder: "🔍 搜索布料名称、店铺..."

**筛选标签：**
- 类型下拉（Select）：全部 / 棉 / 麻 / 丝 / 毛 / 化纤 / 混纺 / 其他
- 状态下拉（Select）：全部 / 闲置中~ / 用掉一点啦~ / 已经用完啦！
- 当筛选激活时（type 或 status 非空），标签下方显示当前筛选摘要："类型：棉 · 状态：闲置"

**排序标签：**
- 排序方式下拉（Select）：
  - 最新添加（created_at_desc，默认）
  - 最早添加（created_at_asc）
  - 最近购买（purchase_date_desc）
  - 最早购买（purchase_date_asc）
  - 价格从高到低（price_desc）
  - 价格从低到高（price_asc）
- 当前排序方式标注

### 组件拆分

| 组件（新建/修改） | 职责 |
|-------------------|------|
| `FilterBar.tsx`（新建，取代 SearchBar） | 三标签容器 + 标签内容 + URL 参数同步 |
| SearchBar.tsx | 可删除，功能合并到 FilterBar |

`FilterBar` 为客户端组件，内部管理 `activeTab` 状态（不写入 URL）。搜索/筛选/排序参数仍然通过 `useSearchParams` + `router.replace` 写入 URL。

## 数据层改动

### `lib/fabrics.ts` — `getAllFabrics`

修复 `sort` 参数被忽略的 bug。在 SQL 中根据 sort 参数动态拼接 `ORDER BY`：

| sort 值 | SQL ORDER BY |
|---------|-------------|
| `created_at_desc`（默认） | `ORDER BY created_at DESC, id DESC` |
| `created_at_asc` | `ORDER BY created_at ASC, id ASC` |
| `purchase_date_desc` | `ORDER BY purchase_date DESC, id DESC` |
| `purchase_date_asc` | `ORDER BY purchase_date ASC, id ASC` |
| `price_desc` | `ORDER BY price DESC, id DESC` |
| `price_asc` | `ORDER BY price ASC, id ASC` |

新增 `status` 筛选支持（当前未实现）：
```sql
AND status = ?
```

### `app/api/fabrics/route.ts` — GET

新增从 `searchParams` 读取 `status` 参数，传给 `getAllFabrics`。

当前已有 `get('type')`、`get('search')`、`get('sort')`，只需追加：
```ts
const status = searchParams.get('status') || undefined
```

### `app/(auth)/page.tsx`

从 `searchParams` 读取 `type`、`status`、`sort` 参数，传给 API。

当前只传 `search`，改为传入全部四个参数。

## 边界情况

| 场景 | 行为 |
|------|------|
| 无匹配结果 | 显示 EmptyState："没有找到匹配的布料" |
| 多个筛选同时激活 | type + status + search 可组合使用，AND 逻辑 |
| 清除筛选 | 下拉选"全部"时从 URL 删除对应参数 |
| 切换标签 | 不丢失其他标签的参数（切到筛选时搜索词仍保留在 URL） |
| 防抖 | 与现有搜索一致：300ms 防抖后再更新 URL |
| 浏览器后退 | URL 参数驱动，后退键正常恢复上一条筛选 |
| 分享链接 | 带参数的 URL 可直接分享，接收者看到相同筛选结果 |

## 不做

- ❌ 不改变现有分页逻辑（客户端分页，每页 6 条）
- ❌ 不改变现有搜索逻辑（LIKE %keyword%）
- ❌ 不增加多选筛选（类型/状态只单选）
- ❌ 不改变 StatsButton、LogoutButton、AddFabricButton
- ❌ 不做服务端分页
