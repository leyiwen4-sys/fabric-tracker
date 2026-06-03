'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Fabric } from '@/lib/fabrics'
import styles from './FabricDetail.module.css'

export default function FabricDetail({ fabric }: { fabric: Fabric }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

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
        alert(json.error || '删除失败')
      }
    } catch {
      alert('网络错误，请重试')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className={styles.photo}>
        {fabric.photo_path ? (
          <img src={fabric.photo_path} alt={fabric.name} />
        ) : (
          '🧶'
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.tags}>
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
