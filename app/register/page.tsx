'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value

    if (!email || !password || !confirm) {
      setError('请填写所有字段')
      return
    }

    if (password !== confirm) {
      setError('两次密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度不能少于 6 位')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || '注册失败')
        setSubmitting(false)
        return
      }
      router.push('/login?registered=1')
      router.refresh()
    } catch {
      setError('网络错误，请重试')
      setSubmitting(false)
    }
  }

  return (
    <div>
      <header style={{
        padding: '12px 16px',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: '17px',
        fontWeight: 600,
      }}>
        🧵 注册
      </header>

      <form onSubmit={handleSubmit} style={{ padding: '24px 16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>邮箱</label>
          <input
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '15px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>密码</label>
          <input
            name="password"
            type="password"
            placeholder="至少 6 位"
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '15px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>确认密码</label>
          <input
            name="confirm"
            type="password"
            placeholder="再次输入密码"
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '15px',
            }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '14px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {submitting ? '注册中...' : '注册'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          已有账号？{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
            去登录
          </Link>
        </p>
      </form>
    </div>
  )
}
