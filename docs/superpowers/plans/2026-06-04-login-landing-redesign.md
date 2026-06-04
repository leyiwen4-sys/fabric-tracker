# 登录页重设计 — 实现计划

> **面向 AI 代理的工作者：** 使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将登录页改造为"登岛"主题欢迎页：Logo 渐显 → 打字机文字 → 按钮淡入 → 原地展开登录表单

**架构：** 纯客户端 React 组件，useState 控制四阶段动画（logo/typing/buttons/form），CSS Module 管理样式和关键帧动画，复用现有 `/api/auth/login` 和 `LoginPage` 中的登录逻辑

**技术栈：** Next.js 16 + React 19 + TypeScript + CSS Module

---

## 文件结构

| 文件 | 职责 | 操作 |
|---|---|---|
| `app/login/LoginPage.module.css` | 所有动画关键帧、布局样式、表单展开过渡 | 创建 |
| `app/login/page.tsx` | 阶段状态管理、打字机 effect、表单展开、API 调用 | 重写 |
| `tests/components/LoginPage.test.tsx` | 渲染验证、交互测试、导航测试 | 创建 |

---

### 任务 1：创建 CSS Module 样式文件

**文件：**
- 创建：`app/login/LoginPage.module.css`

- [ ] **步骤 1：编写完整的 CSS Module**

```css
/* 页面容器 - 相对定位以支持底部背景装饰 */
.container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 60px 20px 0;
  text-align: center;
  overflow: hidden;
}

/* Logo 渐显 */
.logo {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.logoVisible {
  opacity: 1;
}

/* 打字机文字区域 */
.typingArea {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.typingText {
  font-family: 'ZhaohuaTypeWriter', monospace;
  font-size: 15px;
  color: #6b5a4e;
  white-space: nowrap;
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: #d4a574;
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 0.6s steps(1) infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 副标题 */
.subtitle {
  font-size: 11px;
  color: #b8a088;
  letter-spacing: 2px;
  margin-bottom: 28px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}
.subtitleVisible {
  opacity: 1;
  transform: translateY(0);
}

/* 按钮区域 */
.buttons {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 8px;
}

.btnPrimary {
  padding: 13px;
  background: #d4a574;
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  font-family: inherit;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}
.btnPrimaryVisible {
  opacity: 1;
  transform: translateY(0);
}

.btnSecondary {
  padding: 13px;
  background: #fff;
  color: #d4a574;
  border: 1.5px solid #d4a574;
  border-radius: 25px;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}
.btnSecondaryVisible {
  opacity: 1;
  transform: translateY(0);
}

/* 登录表单展开 */
.formWrapper {
  width: 100%;
  max-width: 300px;
  padding: 0 8px;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: 0;
}
.formExpanded {
  max-height: 260px;
  margin-top: 16px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.input:focus {
  border-color: #d4a574;
}

.submitBtn {
  width: 100%;
  padding: 13px;
  background: #d4a574;
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.2s;
}
.submitBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  font-size: 12px;
  text-align: center;
}

/* 底部背景装饰 */
.bgDecoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  overflow: hidden;
  opacity: 0.6;
  z-index: -1;
}
.bgDecoration img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: bottom;
}
.bgGradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, var(--color-bg, #fafaf8) 0%, transparent 100%);
}
```

- [ ] **步骤 2：Commit**

```bash
git add app/login/LoginPage.module.css
git commit -m "feat: add login page CSS module with animations"
```

---

### 任务 2：重写登录页组件

**文件：**
- 修改：`app/login/page.tsx`（完全重写）

- [ ] **步骤 1：编写新的登录页组件代码**

```tsx
'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './LoginPage.module.css'

const TYPEWRITER_TEXT = '哈喽！欢迎你和你的漂亮布来到布记岛！'

type Phase = 'logo' | 'typing' | 'buttons' | 'form'

export default function LoginPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('logo')
  const [typedText, setTypedText] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 阶段 1：Logo 渐显 → 进入打字机阶段
  useEffect(() => {
    const timer = setTimeout(() => setPhase('typing'), 400)
    return () => clearTimeout(timer)
  }, [])

  // 阶段 2：打字机逐字打字
  useEffect(() => {
    if (phase !== 'typing') return

    let i = 0
    const interval = setInterval(() => {
      i++
      setTypedText(TYPEWRITER_TEXT.slice(0, i))
      if (i >= TYPEWRITER_TEXT.length) {
        clearInterval(interval)
        // 打字完成后进入按钮阶段
        setTimeout(() => setPhase('buttons'), 300)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [phase])

  // "立即登岛" 点击 → 展开表单
  function handleStartLogin() {
    setShowForm(true)
    setPhase('form')
  }

  // 提交登录
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || '登录失败')
        setSubmitting(false)
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('网络错误，请重试')
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Logo */}
      <img
        src="/logo-landing.svg"
        alt="布记岛"
        className={`${styles.logo} ${phase !== 'logo' ? styles.logoVisible : ''}`}
      />

      {/* 打字机文字 */}
      <div className={styles.typingArea}>
        {phase !== 'logo' && (
          <>
            <span className={styles.typingText}>{typedText}</span>
            {phase === 'typing' && <span className={styles.cursor} />}
          </>
        )}
      </div>

      {/* 副标题 */}
      <div className={`${styles.subtitle} ${phase === 'buttons' || phase === 'form' ? styles.subtitleVisible : ''}`}>
        ✧ 记录每一寸灵感 ✧
      </div>

      {/* 按钮区域 */}
      <div className={styles.buttons}>
        <button
          className={`${styles.btnPrimary} ${phase === 'buttons' || phase === 'form' ? styles.btnPrimaryVisible : ''}`}
          onClick={handleStartLogin}
          style={phase === 'form' ? { display: 'none' } : undefined}
        >
          立即登岛
        </button>

        <Link
          href="/register"
          className={`${styles.btnSecondary} ${phase === 'buttons' || phase === 'form' ? styles.btnSecondaryVisible : ''}`}
          style={phase === 'form' ? { display: 'none' } : undefined}
        >
          获取上岛身份
        </Link>
      </div>

      {/* 登录表单 - 展开 */}
      <div className={`${styles.formWrapper} ${showForm ? styles.formExpanded : ''}`}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="密码（至少 6 位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <span className={styles.error}>{error}</span>}
          <button className={styles.submitBtn} type="submit" disabled={submitting}>
            {submitting ? '登岛中...' : '确认登岛'}
          </button>
        </form>
      </div>

      {/* 底部背景装饰 */}
      <div className={styles.bgDecoration}>
        <img src="/bg-landing.svg" alt="" />
        <div className={styles.bgGradient} />
      </div>
    </div>
  )
}
```

- [ ] **步骤 2：运行 build 确认无编译错误**

```bash
npx next build
```

预期：构建成功，无编译错误

- [ ] **步骤 3：Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: redesign login page with island theme, typewriter animation, and inline form"
```

---

### 任务 3：编写登录页组件测试

**文件：**
- 创建：`tests/components/LoginPage.test.tsx`

- [ ] **步骤 1：编写测试代码**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LoginPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockPush.mockClear()
    mockRefresh.mockClear()
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('渲染 Logo', async () => {
    render(<LoginPage />)
    const logo = screen.getByAltText('布记岛')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/logo-landing.svg')
  })

  it('Logo 初始不显示，400ms 后渐显', () => {
    render(<LoginPage />)
    const logo = screen.getByAltText('布记岛')
    // 初始：不可见
    expect(logo).not.toHaveClass(/logoVisible/)
    // 400ms 后：可见
    act(() => { vi.advanceTimersByTime(400) })
    expect(logo).toHaveClass(/logoVisible/)
  })

  it('打字机效果在 Logo 之后输出文字', async () => {
    render(<LoginPage />)
    // Logo 阶段：无文字
    expect(screen.queryByText(/哈喽/)).toBeNull()

    // 进入打字机阶段 (400ms)
    act(() => { vi.advanceTimersByTime(400) })

    // 等待打字完成 (100ms/字 × 19字 + 缓冲)
    act(() => { vi.advanceTimersByTime(2000) })

    await waitFor(() => {
      expect(screen.getByText('哈喽！欢迎你和你的漂亮布来到布记岛！')).toBeInTheDocument()
    })
  })

  it('打字完成后显示"立即登岛"和"获取上岛身份"按钮', () => {
    render(<LoginPage />)
    // 快进到按钮阶段
    act(() => { vi.advanceTimersByTime(400) })  // logo
    act(() => { vi.advanceTimersByTime(2500) }) // typing + delay

    expect(screen.getByText('立即登岛')).toBeInTheDocument()
    expect(screen.getByText('获取上岛身份')).toBeInTheDocument()
  })

  it('点击"立即登岛"展开登录表单', async () => {
    render(<LoginPage />)
    // 快进到按钮阶段
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(2500) })

    const loginBtn = screen.getByText('立即登岛')
    await userEvent.click(loginBtn)

    // 表单应该出现
    expect(screen.getByPlaceholderText('邮箱')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/密码/)).toBeInTheDocument()
    expect(screen.getByText('确认登岛')).toBeInTheDocument()
  })

  it('"获取上岛身份"链接跳转到 /register', () => {
    render(<LoginPage />)
    // 快进到按钮阶段
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(2500) })

    const registerLink = screen.getByText('获取上岛身份').closest('a')
    expect(registerLink).toHaveAttribute('href', '/register')
  })

  it('表单提交调用登录 API', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    })

    render(<LoginPage />)
    // 快进到按钮阶段并点击展开
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(2500) })
    await userEvent.click(screen.getByText('立即登岛'))

    // 填写表单
    await userEvent.type(screen.getByPlaceholderText('邮箱'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText(/密码/), 'password')

    // 提交
    await userEvent.click(screen.getByText('确认登岛'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'password' }),
      })
    })
  })

  it('登录成功后跳转首页', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    })

    render(<LoginPage />)
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(2500) })
    await userEvent.click(screen.getByText('立即登岛'))

    await userEvent.type(screen.getByPlaceholderText('邮箱'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText(/密码/), 'password')
    await userEvent.click(screen.getByText('确认登岛'))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('登录失败显示错误信息', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, error: '邮箱或密码错误' }),
    })

    render(<LoginPage />)
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(2500) })
    await userEvent.click(screen.getByText('立即登岛'))

    await userEvent.type(screen.getByPlaceholderText('邮箱'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText(/密码/), 'wrong')
    await userEvent.click(screen.getByText('确认登岛'))

    await waitFor(() => {
      expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument()
    })
  })
})
```

- [ ] **步骤 2：运行测试确认全部通过**

```bash
npx vitest run tests/components/LoginPage.test.tsx
```

预期：全部 8 个测试 PASS

- [ ] **步骤 3：Commit**

```bash
git add tests/components/LoginPage.test.tsx
git commit -m "test: add LoginPage component tests for landing theme"
```

---

### 任务 4：回归验证

- [ ] **步骤 1：运行全部测试**

```bash
npx vitest run
```

预期：全部测试通过（现有 7 套 + 新增 LoginPage 测试）

- [ ] **步骤 2：确认构建成功**

```bash
npx next build
```

预期：构建成功，无错误

- [ ] **步骤 3：Commit**

```bash
git commit -m "chore: regression verification after login page redesign"
```
