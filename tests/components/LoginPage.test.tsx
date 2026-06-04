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

const TYPEWRITER_TEXT = '哈喽！欢迎你和你的漂亮布来到布记岛！'

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

  it('渲染 Logo', () => {
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

    // 等待打字完成 (100ms/字 × 20字 + 缓冲)
    act(() => { vi.advanceTimersByTime(TYPEWRITER_TEXT.length * 100 + 500) })

    await waitFor(() => {
      expect(screen.getByText('哈喽！欢迎你和你的漂亮布来到布记岛！')).toBeInTheDocument()
    })
  })

  it('打字完成后显示"立即登岛"和"获取上岛身份"按钮', () => {
    render(<LoginPage />)
    // 快进到按钮阶段
    act(() => { vi.advanceTimersByTime(400) })  // logo
    act(() => { vi.advanceTimersByTime(TYPEWRITER_TEXT.length * 100 + 500) }) // typing + delay

    expect(screen.getByText('立即登岛')).toBeInTheDocument()
    expect(screen.getByText('获取上岛身份')).toBeInTheDocument()
  })

  it('点击"立即登岛"展开登录表单', async () => {
    render(<LoginPage />)
    // 快进到按钮阶段
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(TYPEWRITER_TEXT.length * 100 + 500) })

    const loginBtn = screen.getByText('立即登岛')
    await userEvent.click(loginBtn)

    // 表单应该出现
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('至少 6 位')).toBeInTheDocument()
    expect(screen.getByText('确认登岛')).toBeInTheDocument()
  })

  it('"获取上岛身份"链接跳转到 /register', () => {
    render(<LoginPage />)
    // 快进到按钮阶段
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(TYPEWRITER_TEXT.length * 100 + 500) })

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
    act(() => { vi.advanceTimersByTime(TYPEWRITER_TEXT.length * 100 + 500) })
    await userEvent.click(screen.getByText('立即登岛'))

    // 填写表单
    await userEvent.type(screen.getByPlaceholderText('your@email.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('至少 6 位'), 'password')

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
    act(() => { vi.advanceTimersByTime(TYPEWRITER_TEXT.length * 100 + 500) })
    await userEvent.click(screen.getByText('立即登岛'))

    await userEvent.type(screen.getByPlaceholderText('your@email.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('至少 6 位'), 'password')
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
    act(() => { vi.advanceTimersByTime(TYPEWRITER_TEXT.length * 100 + 500) })
    await userEvent.click(screen.getByText('立即登岛'))

    await userEvent.type(screen.getByPlaceholderText('your@email.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('至少 6 位'), 'wrong')
    await userEvent.click(screen.getByText('确认登岛'))

    await waitFor(() => {
      expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument()
    })
  })
})
