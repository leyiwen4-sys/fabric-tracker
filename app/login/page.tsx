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
    let doneTimer: ReturnType<typeof setTimeout>
    const interval = setInterval(() => {
      i++
      setTypedText(TYPEWRITER_TEXT.slice(0, i))
      if (i >= TYPEWRITER_TEXT.length) {
        clearInterval(interval)
        doneTimer = setTimeout(() => setPhase('buttons'), 300)
      }
    }, 100)

    return () => {
      clearInterval(interval)
      clearTimeout(doneTimer)
    }
  }, [phase])

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
          className={`${styles.btnPrimary} ${phase === 'buttons' ? styles.btnPrimaryVisible : ''}`}
          onClick={handleStartLogin}
        >
          立即登岛
        </button>

        <Link
          href="/register"
          className={`${styles.btnSecondary} ${phase === 'buttons' ? styles.btnSecondaryVisible : ''}`}
        >
          获取上岛身份
        </Link>
      </div>

      {/* 登录表单 - 展开 */}
      <div className={`${styles.formWrapper} ${phase === 'form' ? styles.formExpanded : ''}`}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>邮箱</label>
          <input
            className={styles.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px', marginTop: '4px' }}>密码</label>
          <input
            className={styles.input}
            type="password"
            placeholder="至少 6 位"
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
