'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Fabric } from '@/lib/fabrics'
import { showToast } from '@/components/Toast'
import styles from './FabricDetail.module.css'

export default function FabricDetail({ fabric }: { fabric: Fabric }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const photos: string[] = (() => {
    try { return JSON.parse(fabric.photos || '[]') }
    catch { return fabric.photo_path ? [fabric.photo_path] : [] }
  })()
  const [activePhoto, setActivePhoto] = useState<string | null>(photos[0] || null)

  const statusLabels: Record<string, string> = {
    idle: '🟢 闲置',
    used: '🟡 已用',
    empty: '⚪ 已用完',
  }

  async function toggleStatus() {
    const statuses = ['idle', 'used', 'empty']
    const currentIndex = statuses.indexOf(fabric.status || 'idle')
    const nextStatus = statuses[(currentIndex + 1) % 3]

    try {
      const fd = new FormData()
      fd.append('status', nextStatus)
      const res = await fetch(`/api/fabrics/${fabric.id}`, { method: 'PUT', body: fd })
      const json = await res.json()
      if (json.success) {
        window.location.reload()
      } else {
        showToast(json.error || '更新失败', 'error')
      }
    } catch {
      showToast('状态更新失败', 'error')
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('确定要删除这块布料吗？此操作不可撤销。')
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/fabrics/${fabric.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        router.push('/')
        router.refresh()
      } else {
        showToast(json.error || '删除失败', 'error')
      }
    } catch {
      showToast('删除失败，请重试', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className={styles.photo}>
        {activePhoto ? (
          <img src={activePhoto} alt={fabric.name} />
        ) : (
          '🧶'
        )}
      </div>

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
        <div className={styles.tags}>
          <span className={styles.tag} onClick={toggleStatus} style={{ cursor: 'pointer' }}>
            {statusLabels[fabric.status || 'idle']}
          </span>
          <span className={styles.tag}>{fabric.type}</span>
          {fabric.width && <span className={styles.tag}>{fabric.width}cm</span>}
          {fabric.price && (
            <span className={styles.tag}>¥{fabric.price}/{fabric.unit}</span>
          )}
        </div>

        <div className={styles.infoList}>
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
        <Link href={`/fabrics/${fabric.id}/edit`} className={styles.editBtn}>
          ✏️ 编辑
        </Link>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '删除中...' : '🗑'}
        </button>
      </div>
    </>
  )
}
