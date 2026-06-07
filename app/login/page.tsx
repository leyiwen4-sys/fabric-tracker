'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Typewriter, Button, Input, Card, Modal, Title, Loading } from 'animal-island-ui'
import styles from './LoginPage.module.css'

const WELCOME_TEXT = '哈喽！欢迎你和你的漂亮布料一起入住布记岛！如果第一次来，请先获取登岛身份~已经有布记岛身份的居民请点击登录~'

type Phase = 'logo' | 'typing' | 'buttons' | 'form'

export default function LoginPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('logo')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  // 阶段 1：Logo 渐显 → 进入打字机阶段
  useEffect(() => {
    const timer = setTimeout(() => setPhase('typing'), 400)
    return () => clearTimeout(timer)
  }, [])

  // 阶段 2 → 3：Typewriter 完成 → 显示按钮
  function handleTypingDone() {
    setPhase('buttons')
  }

  // "立即登岛" 点击 → 展开表单
  function handleStartLogin() {
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
      setShowLoading(true)
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1200)
    } catch {
      setError('网络错误，请重试')
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* 加载动画 — 仅在 active 时渲染，避免遮挡 */}
      {showLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <Loading active />
        </div>
      )}

      <div className={styles.container}>
        {/* Logo */}
        <img
        src="/logo-landing.svg"
        alt="布记岛"
        className={`${styles.logo} ${phase !== 'logo' ? styles.logoVisible : ''}`}
      />

      {/* 打字机文字 — 虚线边框卡片，宽度与按钮一致 */}
      <div className={styles.typingArea}>
        {(phase === 'typing' || phase === 'buttons' || phase === 'form') && (
          <Card type="dashed">
            {phase === 'typing' && (
              <Typewriter speed={80} onDone={handleTypingDone}>
                <p className={styles.typingLine}>{WELCOME_TEXT}</p>
              </Typewriter>
            )}
            {(phase === 'buttons' || phase === 'form') && (
              <p className={styles.typingLine}>{WELCOME_TEXT}</p>
            )}
          </Card>
        )}
      </div>

      {/* 按钮区域 */}
      <div className={styles.buttons}>
        {(phase === 'buttons' || phase === 'form') && (
          <>
            <Button type="primary" size="large" block onClick={handleStartLogin}>
              立即登岛
            </Button>
            <Button type="primary" size="large" block onClick={() => router.push('/register')}>
              获取上岛身份
            </Button>
          </>
        )}
      </div>

      {/* 登录表单 — 展开后用 Card 包裹 */}
      <div className={`${styles.formWrapper} ${phase === 'form' ? styles.formExpanded : ''}`}>
        <Card type="dashed">
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <Title size="small" color="app-green">邮箱</Title>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="large"
                className={styles.formInput}
              />
            </div>

            <div className={styles.field}>
              <Title size="small" color="app-green">密码</Title>
              <Input
                type="password"
                placeholder="至少 6 位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="large"
                className={styles.formInput}
              />
            </div>

            <div className={styles.submitWrap}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
              >
                {submitting ? '登岛中...' : '确认登岛'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* 错误弹窗 */}
      <Modal
        open={!!error}
        title="提示"
        onClose={() => setError(null)}
        typewriter={false}
        footer={
          <Button type="primary" onClick={() => setError(null)}>确定</Button>
        }
      >
        {error}
      </Modal>

      {/* 底部背景装饰 */}
      <div className={styles.bgDecoration}>
        <img src="/bg-landing.svg" alt="" />
        <div className={styles.bgGradient} />
      </div>
    </div>
    </>
  )
}
