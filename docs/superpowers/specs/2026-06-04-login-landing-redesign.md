# 登录页重设计 — 登岛主题

**日期**: 2026-06-04
**状态**: 已确认

---

## 概述

将登录页改造为"登岛"主题的欢迎页，采用 Logo 优先布局 + 打字机动效 + 原地展开登录表单的交互模式。

## 视觉素材

| 文件 | 用途 | 位置 |
|---|---|---|
| `1.svg` | 底部背景装饰 | `public/bg-landing.svg` |
| `2.svg` | Logo | `public/logo-landing.svg` |

## 页面结构

```
┌──────────────────────┐
│                      │
│    🖼️ Logo (2.svg)   │  ← opacity 渐显 0→1，0.4s
│                      │
│  哈喽！欢迎你和你的   │  ← 打字机逐字打出，0.4→2.5s
│  漂亮布来到布记岛！   │     （18字符 + 感叹号 ~2.1s）
│                      │
│  ┌────────────────┐  │
│  │   🚀 立即登岛   │  │  ← 暖金实心按钮，淡入上浮 2.5→3s
│  └────────────────┘  │     点击 → 展开登录表单
│  ┌────────────────┐  │
│  │  获取上岛身份   │  │  ← 描边按钮，淡入上浮 2.5→3s
│  └────────────────┘  │     点击 → 跳转 /register
│                      │
│  ▓▓▓▓ 背景装饰 ▓▓▓▓  │  ← 1.svg 底部 ~30% 区域
└──────────────────────┘
```

## 交互逻辑

### "立即登岛"按钮
- 点击后在按钮下方平滑展开邮箱输入框 + 密码输入框 + "确认登岛"提交按钮
- 展开动画：`max-height` transition，0.3s ease
- 登录成功后跳转首页 `/`
- 登录失败 Toast 提示错误

### "获取上岛身份"按钮
- 点击后直接跳转 `/register`

### 登录状态
- 如果用户已登录（有有效 token），自动跳转首页 `/`

## 动效时序

| 阶段 | 时间 | 元素 | 动画 |
|---|---|---|---|
| 1 | 0 → 0.4s | Logo (2.svg) | `opacity: 0→1`，`transition 0.4s` |
| 2 | 0.4 → 2.5s | 打字机文字 | `setInterval` 逐字追加，光标闪烁 |
| 3 | 2.5 → 3.0s | 两个按钮 | `opacity: 0→1` + `translateY: 20px→0`，`transition 0.5s` |
| 4 | 点击后 | 登录表单 | `max-height: 0→200px`，`transition 0.3s` |

## 技术要点

- **组件类型**: `'use client'` 客户端组件
- **打字机效果**: `useState` 存储当前文字长度，`useEffect` + `setInterval` 逐字追加，完成后清除 interval
- **动效阶段**: `useState<'logo'|'typing'|'buttons'|'form'>` 控制四个阶段
- **表单展开**: CSS `overflow: hidden` + `max-height` transition
- **字体**: ZhaohuaTypeWriter（已在 globals.css 中加载）
- **页面路径**: `app/login/page.tsx`（覆盖现有登录页）
- **不影响**: `app/register/page.tsx`、API 路由、其他页面

## 样式规范

- **主色调**: `#d4a574` (暖金，与现有一致)
- **按钮**: `border-radius: 25px` (圆角胶囊形)
- **排版**: Logo zone 居中，文字 `font-family: monospace`/ZhaohuaTypeWriter
- **背景装饰**: 底部 30% 区域，`opacity: 0.6`，顶部渐变过渡

## 涉及文件

| 文件 | 操作 |
|---|---|
| `app/login/page.tsx` | 重写（现有功能保留，结构重做） |
| `public/bg-landing.svg` | 已就位 |
| `public/logo-landing.svg` | 已就位 |
| `tests/` | 新增登录页组件测试（可选） |
