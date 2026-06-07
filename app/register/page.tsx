'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Input, Button, Title, Modal, Loading } from 'animal-island-ui'
import styles from './RegisterPage.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

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
      setShowLoading(true)
      setTimeout(() => {
        router.push('/login?registered=1')
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
        {/* 顶部：标题 */}
        <header className={styles.header}>
          <Title size="middle">获取上岛身份</Title>
        </header>

      <div className={styles.formArea}>
        <Card type="dashed">
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>邮箱</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="large"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>密码</label>
              <Input
                type="password"
                placeholder="至少 6 位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="large"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>确认密码</label>
              <Input
                type="password"
                placeholder="再次输入密码"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                size="large"
              />
            </div>

            <div>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
              >
                {submitting ? '注册中...' : '我填好啦！'}
              </Button>
            </div>

            <p className={styles.linkText}>
              已有账号？{' '}
              <Button type="link" onClick={() => router.push('/login')}>
                去登录
              </Button>
            </p>
          </form>
        </Card>
      </div>

      {/* 加载动画 */}
      <Loading active={showLoading} />

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

    </div>
    </>
  )
}
