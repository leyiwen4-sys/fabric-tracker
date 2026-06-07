'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Fabric } from '@/lib/fabrics'
import { Card, Button, Icon, Select, Modal } from 'animal-island-ui'
import styles from './FabricDetail.module.css'

export default function FabricDetail({ fabric }: { fabric: Fabric }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const photos: string[] = (() => {
    try { return JSON.parse(fabric.photos || '[]') }
    catch { return fabric.photo_path ? [fabric.photo_path] : [] }
  })()
  const [activePhoto, setActivePhoto] = useState<string | null>(photos[0] || null)

  const STATUS_OPTIONS = [
    { key: 'idle', label: '闲置中~' },
    { key: 'used', label: '用掉一点啦~' },
    { key: 'empty', label: '已经用完啦！' },
  ]

  const [currentStatus, setCurrentStatus] = useState(fabric.status || 'idle')

  async function handleStatusChange(status: string) {
    setCurrentStatus(status)
    try {
      const fd = new FormData()
      fd.append('status', status)
      const res = await fetch(`/api/fabrics/${fabric.id}`, { method: 'PUT', body: fd })
      const json = await res.json()
      if (json.success) {
        router.refresh()
      } else {
        setError(json.error || '更新失败')
        setCurrentStatus(fabric.status || 'idle')
      }
    } catch {
      setError('状态更新失败')
      setCurrentStatus(fabric.status || 'idle')
    }
  }

  async function handleDelete() {
    setShowDeleteConfirm(false)
    setDeleting(true)
    try {
      const res = await fetch(`/api/fabrics/${fabric.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(json.error || '删除失败')
      }
    } catch {
      setError('删除失败，请重试')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card style={{ background: 'transparent', margin: '0 12px' }}>
        <div className={styles.photo}>
          {activePhoto ? (
            <img src={activePhoto} alt={fabric.name} />
          ) : (
            '🧶'
          )}
        </div>
      </Card>

      {photos.length > 1 && (
        <div className={styles.thumbnailStrip}>
          {photos.map((p, i) => (
            <img
              key={i}
              src={p}
              alt=""
              onClick={() => setActivePhoto(p)}
              className={`${styles.stripThumb} ${activePhoto === p ? styles.stripThumbActive : ''}`}
            />
          ))}
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>状态</span>
            <Select
              value={currentStatus}
              onChange={handleStatusChange}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>类型</span>
            <span>{fabric.type}</span>
          </div>
          {fabric.width && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>幅宽</span>
              <span>{fabric.width}cm</span>
            </div>
          )}
          {fabric.price && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>单价</span>
              <span>¥{fabric.price}/{fabric.unit}</span>
            </div>
          )}
          {fabric.store && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>店铺</span>
              <span>{fabric.store}</span>
            </div>
          )}
          {fabric.purchase_date && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>日期</span>
              <span>{fabric.purchase_date}</span>
            </div>
          )}
          {fabric.notes && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>备注</span>
              <span>{fabric.notes}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          type="primary"
          size="large"
          icon={<Icon item={447} size={18} />}
          onClick={() => router.push(`/fabrics/${fabric.id}/edit`)}
          style={{ flex: 1 }}
        >
          编辑
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<Icon item={474} size={18} />}
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
          style={{ flex: 1 }}
        >
          {deleting ? '删除中...' : '删除'}
        </Button>
      </div>

      {/* 删除确认弹窗 */}
      <Modal
        open={showDeleteConfirm}
        title="确认删除"
        onClose={() => setShowDeleteConfirm(false)}
        typewriter={false}
        footer={
          <>
            <Button type="primary" onClick={() => setShowDeleteConfirm(false)}>再想想~</Button>
            <Button type="primary" onClick={handleDelete}>嗯，删除</Button>
          </>
        }
      >
        确定要删除这块布料吗？此操作不可撤销 🧵
      </Modal>

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
    </>
  )
}
