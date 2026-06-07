import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

// Mock animal-island-ui — its ESM bundle imports PNG files,
// which causes "Unknown file extension" in vitest's Node context.
vi.mock('animal-island-ui', () => {
  // We can't use JSX here because vi.mock factory is hoisted
  // and runs outside the JSX transform. Use createElement instead.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const R = require('react') as typeof import('react')

  const Button = R.forwardRef(
    (props: Record<string, unknown>, ref: unknown) => {
      const { type, size, block, danger, ghost, loading, disabled, icon, htmlType, ...rest } = props
      return R.createElement('button', {
        ...rest,
        type: (htmlType as string) ?? 'button',
        ref,
        disabled: disabled as boolean,
        'data-loading': loading ? '' : undefined,
      }, (props as any).children)
    },
  )
  Button.displayName = 'Button'

  const Input = R.forwardRef(
    (props: Record<string, unknown>, ref: unknown) =>
      R.createElement('input', { ...props, ref }),
  )
  Input.displayName = 'Input'

  const Card = R.forwardRef(
    (props: Record<string, unknown>, ref: unknown) =>
      R.createElement('div', { ...props, ref }, (props as any).children),
  )
  Card.displayName = 'Card'

  const Typewriter = (props: Record<string, unknown>) => {
    const { onDone, children } = props as { onDone?: () => void; children?: React.ReactNode }
    R.useEffect(() => {
      if (typeof onDone === 'function') onDone()
    }, [onDone])
    return R.createElement(R.Fragment, null, children)
  }

  const Modal = (props: Record<string, unknown>) => {
    const { open, children, footer } = props as { open?: boolean; children?: React.ReactNode; footer?: React.ReactNode }
    if (!open) return null
    return R.createElement('div', { 'data-testid': 'modal' }, children, footer)
  }

  const Title = (props: Record<string, unknown>) =>
    R.createElement('div', { 'data-testid': 'title' }, (props as any).children)

  const Icon = (props: Record<string, unknown>) =>
    R.createElement('span', { 'data-testid': 'icon' })

  const Divider = () => R.createElement('hr', { 'data-testid': 'divider' })

  const Loading = (props: Record<string, unknown>) =>
    (props as any).active ? R.createElement('div', { 'data-testid': 'loading' }) : null

  return { Button, Input, Card, Typewriter, Modal, Title, Icon, Divider, Loading, Cursor: (p: any) => p.children, Footer: () => null, ICON_LIST: [] }
})

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

const WELCOME_TEXT = '哈喽！欢迎你和你的漂亮布料一起入住布记岛！如果第一次来，请先获取登岛身份~已经有布记岛身份的居民请点击登录~'

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

    // 进入打字机阶段 (400ms) → mock Typewriter 立即触发 onDone
    act(() => { vi.advanceTimersByTime(400) })

    await waitFor(() => {
      expect(screen.getByText(/欢迎你和你的漂亮布料/)).toBeInTheDocument()
    })
  })

  it('打字完成后显示"立即登岛"和"获取上岛身份"按钮', () => {
    render(<LoginPage />)
    // 快进到按钮阶段
    act(() => { vi.advanceTimersByTime(400) })  // logo
    act(() => { vi.advanceTimersByTime(0 /* mock Typewriter calls onDone instantly */ * 100 + 500) }) // typing + delay

    expect(screen.getByText('立即登岛')).toBeInTheDocument()
    expect(screen.getByText('获取上岛身份')).toBeInTheDocument()
  })

  it('点击"立即登岛"展开登录表单', async () => {
    render(<LoginPage />)
    // 快进到按钮阶段
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(0 /* mock Typewriter calls onDone instantly */ * 100 + 500) })

    const loginBtn = screen.getByText('立即登岛')
    await userEvent.click(loginBtn)

    // 表单应该出现
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('至少 6 位')).toBeInTheDocument()
    expect(screen.getByText('确认登岛')).toBeInTheDocument()
  })

  it('"获取上岛身份"按钮点击跳转到 /register', async () => {
    render(<LoginPage />)
    // 快进到按钮阶段
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(0 /* mock Typewriter calls onDone instantly */ * 100 + 500) })

    const registerBtn = screen.getByText('获取上岛身份')
    await userEvent.click(registerBtn)

    expect(mockPush).toHaveBeenCalledWith('/register')
  })

  it('表单提交调用登录 API', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    })

    render(<LoginPage />)
    // 快进到按钮阶段并点击展开
    act(() => { vi.advanceTimersByTime(400) })
    act(() => { vi.advanceTimersByTime(0 /* mock Typewriter calls onDone instantly */ * 100 + 500) })
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
    act(() => { vi.advanceTimersByTime(0 /* mock Typewriter calls onDone instantly */ * 100 + 500) })
    await userEvent.click(screen.getByText('立即登岛'))

    await userEvent.type(screen.getByPlaceholderText('your@email.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('至少 6 位'), 'password')
    await userEvent.click(screen.getByText('确认登岛'))

    // 加载动画后再跳转 (1200ms setTimeout)
    act(() => { vi.advanceTimersByTime(1200) })

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
    act(() => { vi.advanceTimersByTime(0 /* mock Typewriter calls onDone instantly */ * 100 + 500) })
    await userEvent.click(screen.getByText('立即登岛'))

    await userEvent.type(screen.getByPlaceholderText('your@email.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('至少 6 位'), 'wrong')
    await userEvent.click(screen.getByText('确认登岛'))

    await waitFor(() => {
      expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument()
    })
  })
})
