'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Fabric } from '@/lib/fabrics'
import { showToast } from '@/components/Toast'
import styles from './FabricForm.module.css'

interface Props {
  fabric?: Fabric
}

export default function FabricForm({ fabric }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    fabric?.photo_path || null
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!fabric

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const unit = formData.get('unit') as string

    if (!name?.trim()) {
      setError('请输入布料名称')
      return
    }
    if (!type?.trim()) {
      setError('请输入布料类型')
      return
    }
    if (!unit?.trim()) {
      setError('请输入单位')
      return
    }

    setSubmitting(true)

    try {
      const url = isEdit ? `/api/fabrics/${fabric.id}` : '/api/fabrics'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, { method, body: formData })
      const json = await res.json()

      if (!json.success) {
        setError(json.error || '保存失败')
        setSubmitting(false)
        return
      }

      showToast(isEdit ? '更新成功' : '添加成功', 'success')
      router.push(`/fabrics/${json.data.id}`)
      router.refresh()
    } catch {
      setError('网络错误，请重试')
      showToast('网络错误，请重试', 'error')
      setSubmitting(false)
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.photoUpload} onClick={() => fileInputRef.current?.click()}>
        {photoPreview ? (
          <img src={photoPreview} alt="预览" className={styles.photoPreview} />
        ) : (
          <>
            <div style={{ fontSize: '32px' }}>📷</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              点击拍照或选择照片
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.label}>布料名称 *</label>
          <input className={styles.input} name="name" placeholder="输入布料名称，例如：碎花亚麻" defaultValue={fabric?.name || ''} required />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>类型 *</label>
            <input className={styles.input} name="type" placeholder="棉 / 麻 / 丝 / 毛 / 化纤 / 混纺 / 其他" defaultValue={fabric?.type || ''} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>幅宽 (cm)</label>
            <input className={styles.input} name="width" type="number" step="0.5" placeholder="145" defaultValue={fabric?.width || ''} />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>单位 *</label>
            <input className={styles.input} name="unit" placeholder="米 / 码" defaultValue={fabric?.unit || ''} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>单价 (元)</label>
            <input className={styles.input} name="price" type="number" step="0.01" placeholder="28" defaultValue={fabric?.price || ''} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>购买店铺</label>
          <input className={styles.input} name="store" placeholder="例如：晓港布料市场 2F-38" defaultValue={fabric?.store || ''} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>购买日期</label>
          <input className={styles.input} name="purchase_date" type="date" defaultValue={fabric?.purchase_date || ''} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>使用状态</label>
          <select
            className={styles.input}
            name="status"
            defaultValue={fabric?.status || 'idle'}
          >
            <option value="idle">🟢 闲置</option>
            <option value="used">🟡 已用</option>
            <option value="empty">⚪ 已用完</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>备注</label>
          <textarea className={styles.textarea} name="notes" placeholder="手感、适合做什么等..." defaultValue={fabric?.notes || ''} />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting ? '保存中...' : '保存'}
      </button>
    </form>
  )
}
