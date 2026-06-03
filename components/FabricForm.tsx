'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Fabric } from '@/lib/fabrics'
import { showToast } from '@/components/Toast'
import styles from './FabricForm.module.css'

interface Props {
  fabric?: Fabric
}

const MAX_PHOTOS = 3

type PhotoItem =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; preview: string }

function buildInitialPhotos(fabric?: Fabric): PhotoItem[] {
  if (fabric?.photos) {
    try {
      const urls: string[] = JSON.parse(fabric.photos)
      if (urls.length > 0) {
        return urls.map(url => ({ kind: 'existing' as const, url }))
      }
    } catch { /* fall through */ }
  }
  if (fabric?.photo_path) {
    return [{ kind: 'existing' as const, url: fabric.photo_path }]
  }
  return []
}

export default function FabricForm({ fabric }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(buildInitialPhotos(fabric))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!fabric

  function getPreviewUrl(item: PhotoItem): string {
    return item.kind === 'existing' ? item.url : item.preview
  }

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = MAX_PHOTOS - photoItems.length
    if (remaining <= 0) { e.target.value = ''; return }

    const toAdd = Math.min(files.length, remaining)
    const newItems: PhotoItem[] = []
    for (let i = 0; i < toAdd; i++) {
      newItems.push({
        kind: 'new',
        file: files[i],
        preview: URL.createObjectURL(files[i]),
      })
    }
    setPhotoItems(prev => [...prev, ...newItems])
    e.target.value = ''
  }

  function removePhoto(index: number) {
    setPhotoItems(prev => prev.filter((_, i) => i !== index))
  }

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

    // Append photo data
    photoItems.forEach((item, i) => {
      if (item.kind === 'existing') {
        formData.append(`existing_${i}`, item.url)
      } else {
        formData.append(`photo_${i}`, item.file)
      }
    })

    setSubmitting(true)

    try {
      const url = isEdit ? `/api/fabrics/${fabric!.id}` : '/api/fabrics'
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

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div
        className={photoItems.length > 0 ? styles.photoUploadFilled : styles.photoUpload}
        onClick={() => {
          if (photoItems.length === 0) fileInputRef.current?.click()
        }}
      >
        {photoItems.length > 0 ? (
          <div className={styles.thumbnailRow}>
            {photoItems.map((item, i) => (
              <div key={i} className={styles.thumbnail}>
                <img
                  src={getPreviewUrl(item)}
                  alt=""
                  className={styles.thumbnailImg}
                />
                <span
                  className={styles.thumbnailRemove}
                  onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                >&times;</span>
              </div>
            ))}
            {photoItems.length < MAX_PHOTOS && (
              <div
                className={styles.addBtn}
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              >+</div>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontSize: '32px' }}>📷</div>
            <div className={styles.uploadHint}>
              点击拍照或选择照片（最多 3 张）
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotosChange}
          className={styles.hiddenFileInput}
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
