# 布料详情页 UI 优化 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将布料详情页统一到 animal-island-ui 组件体系，与列表页/编辑页/统计页风格一致。

**架构：** 替换内联 header 为 BackHeader，用 Card 包裹内容区，Button+Icon 替换操作按钮。不改变任何业务逻辑。

**技术栈：** Next.js 16, React 19, animal-island-ui, CSS Modules, Vitest

---

### 任务 1：更新详情页服务端组件

**文件：**
- 修改：`app/(auth)/fabrics/[id]/page.tsx`

- [ ] **步骤 1：替换 header 为 BackHeader，添加统一容器**

将内联样式的 `<header>` 替换为 `<BackHeader>`，外层包裹统一容器：

```tsx
import BackHeader from '@/components/BackHeader'

// ... (imports 和逻辑不变)

return (
  <div style={{ minHeight: '100vh', background: 'var(--color-paper)' }}>
    <BackHeader title={fabric.name} href="/" />
    <FabricDetail fabric={fabric} />
  </div>
)
```

移除原有内联 `<header>` 块（第 24-36 行）。

- [ ] **步骤 2：运行 build 验证编译**

```bash
npm run build
```

预期：编译成功，无 TypeScript 错误。

- [ ] **步骤 3：Commit**

```bash
git add app/(auth)/fabrics/[id]/page.tsx
git commit -m "refactor: replace inline header with BackHeader on detail page"
```

---

### 任务 2：重构 FabricDetail 客户端组件

**文件：**
- 修改：`components/FabricDetail.tsx`

- [ ] **步骤 1：导入 animal-island-ui 组件**

在现有 imports 中添加 `Card`, `Button`, `Icon`：

```tsx
import { Card, Button, Icon } from 'animal-island-ui'
```

- [ ] **步骤 2：用 Card 包裹照片区**

替换照片区 `<div className={styles.photo}>` 为 Card 包裹的大圆角卡片：

```tsx
<Card style={{ background: 'transparent', margin: '12px' }}>
  <div className={styles.photo}>
    {activePhoto ? (
      <img src={activePhoto} alt={fabric.name} />
    ) : (
      '🧶'
    )}
  </div>
</Card>
```

- [ ] **步骤 3：用 Button+Icon 替换编辑链接**

将 `<Link href={...} className={styles.editBtn}>✏️ 编辑</Link>` 替换为：

```tsx
<Button
  type="primary"
  size="large"
  icon={<Icon item={447} size={18} />}
  onClick={() => router.push(`/fabrics/${fabric.id}/edit`)}
  style={{ flex: 1 }}
>
  编辑
</Button>
```

- [ ] **步骤 4：用 Button+Icon 替换删除按钮**

将 `<button className={styles.deleteBtn} ...>` 替换为：

```tsx
<Button
  type="default"
  size="large"
  icon={<Icon item={474} size={18} />}
  onClick={handleDelete}
  disabled={deleting}
  style={{ width: 56, height: 44 }}
>
  {deleting ? '...' : ''}
</Button>
```

- [ ] **步骤 5：调整 actions 容器和整体结构**

保持 action 容器中的 flex 布局，让编辑和删除按钮并排：

```tsx
<div className={styles.actions}>
  {/* 编辑 Button */}
  {/* 删除 Button (仅图标) */}
</div>
```

- [ ] **步骤 6：运行 build 验证编译**

```bash
npm run build
```

预期：编译成功。

- [ ] **步骤 7：Commit**

```bash
git add components/FabricDetail.tsx
git commit -m "refactor: use Card, Button+Icon from animal-island-ui in FabricDetail"
```

---

### 任务 3：更新 CSS 样式

**文件：**
- 修改：`components/FabricDetail.module.css`

- [ ] **步骤 1：更新照片区为卡片式大图**

```css
/* === 照片 — 大圆角卡片 ✦ === */
.photo {
  width: 100%;
  height: 280px;
  background:
    radial-gradient(ellipse at 50% 50%, oklch(92% 0.015 20) 0%, transparent 50%),
    var(--color-linen-light);
  border-radius: var(--radius-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
```

关键改动：高度 260→280px，添加 `border-radius: var(--radius-card)`、`overflow: hidden`、`box-shadow: var(--shadow-card)`。

- [ ] **步骤 2：移除不再需要的操作按钮样式**

删除 `.editBtn` 和 `.deleteBtn` 规则（第 99-148 行），因为现在使用 animal-island-ui Button。

- [ ] **步骤 3：简化 actions 容器**

```css
/* === 操作区 === */
.actions {
  display: flex;
  gap: 12px;
  padding: 0 var(--space-md) 24px;
}
```

移除顶部多余的 4px padding。

- [ ] **步骤 4：运行 build 验证编译**

```bash
npm run build
```

预期：编译成功。

- [ ] **步骤 5：Commit**

```bash
git add components/FabricDetail.module.css
git commit -m "style: update detail photo to card style, remove unused button styles"
```

---

### 任务 4：验证 — 运行测试和构建

**文件：**
- 无新建/修改

- [ ] **步骤 1：运行全部测试**

```bash
npm test
```

预期：所有测试通过。

- [ ] **步骤 2：运行完整构建**

```bash
npm run build
```

预期：构建成功，无警告。

- [ ] **步骤 3：Commit（如有遗留）**

```bash
git status
# 如有未提交的变更：
git add -A
git commit -m "chore: final verification after detail page optimization"
```
