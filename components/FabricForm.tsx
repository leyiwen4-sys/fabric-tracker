'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Fabric } from '@/lib/fabrics'
import { Card, Input, Button, Modal, Loading, Select, Divider, Icon } from 'animal-island-ui'
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

const STATUS_OPTIONS = [
  { key: 'idle', label: '闲置中~' },
  { key: 'used', label: '用掉一点啦~' },
  { key: 'empty', label: '已经用完啦！' },
]

export default function FabricForm({ fabric }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(buildInitialPhotos(fabric))
  const [status, setStatus] = useState(fabric?.status || 'idle')
  const [name, setName] = useState(fabric?.name || '')
  const [type, setType] = useState(fabric?.type || '')
  const [unit, setUnit] = useState(fabric?.unit || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

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

    if (!name.trim()) {
      setError('请输入布料名称')
      return
    }
    if (!type.trim()) {
      setError('请输入布料类型')
      return
    }
    if (!unit.trim()) {
      setError('请输入单位')
      return
    }

    const form = e.currentTarget
    const formData = new FormData(form)

    // 可控字段直接写入 FormData
    formData.set('name', name)
    formData.set('type', type)
    formData.set('unit', unit)
    formData.set('status', status)

    // 数值字段：避免 NaN
    const widthVal = formData.get('width') as string
    const priceVal = formData.get('price') as string
    if (widthVal) formData.set('width', String(parseFloat(widthVal) || ''))
    if (priceVal) formData.set('price', String(parseFloat(priceVal) || ''))

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
        setError(json.error || '啊哦保存失败！请重试~')
        setSubmitting(false)
        return
      }

      setShowLoading(true)
      setTimeout(() => {
        setShowLoading(false)
        setSuccess(isEdit ? '布料更新成功！！' : '布料添加成功！！')
      }, 1000)
    } catch {
      setError('网络错误，请重试~')
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* 加载动画 */}
      {showLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <Loading active />
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* 照片上传 */}
        {/* 隐藏的文件输入 — 始终渲染，避免 ref 切换问题 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotosChange}
          style={{ display: 'none' }}
        />

        {/* 照片上传 */}
        <Card type="dashed" style={{ background: 'transparent' }}>
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
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <div className={styles.uploadHint}>
                  点击拍照或选择照片（最多 3 张）
                </div>
              </>
            )}
          </div>
        </Card>

        {/* 表单字段 */}
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>-布料名称-*</label>
            <Input placeholder="输入布料名称，例如：碎花亚麻" value={name} onChange={(e) => setName(e.target.value)} size="large" />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>-类型-*</label>
              <Input placeholder="棉 / 麻 / 丝 / 毛 / 化纤 / 混纺 / 其他" value={type} onChange={(e) => setType(e.target.value)} size="large" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>-单位-*</label>
              <Input placeholder="米 / 码" value={unit} onChange={(e) => setUnit(e.target.value)} size="large" />
            </div>
          </div>

          {/* 必填 / 选填分割 */}
          <Divider type="dashed-brown" />
          <p className={styles.optionalHint}>*以下为选填信息~</p>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>-幅宽 (cm)-</label>
              <Input name="width" type="number" step="0.5" placeholder="145" defaultValue={fabric?.width || ''} size="large" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>-单价 (元)-</label>
              <Input name="price" type="number" step="0.01" placeholder="28" defaultValue={fabric?.price || ''} size="large" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>-使用状态-</label>
              <Select
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>-购买日期-</label>
              <Input name="purchase_date" type="date" defaultValue={fabric?.purchase_date || ''} size="large" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>-购买店铺-</label>
            <Input name="store" placeholder="例如：晓港布料市场 2F-38" defaultValue={fabric?.store || ''} size="large" />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>-备注-</label>
            <Input name="notes" placeholder="手感、适合做什么等..." defaultValue={fabric?.notes || ''} size="large" />
          </div>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={submitting}
          icon={submitting ? undefined : <Icon item={481} size={18} />}
        >
          {submitting ? '保存中...' : '保存'}
        </Button>
      </form>

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

      {/* 成功弹窗 */}
      <Modal
        open={!!success}
        title="添加成功啦"
        onClose={() => {
          setSuccess(null)
          router.push('/')
          router.refresh()
        }}
        typewriter={false}
        footer={
          <Button type="primary" onClick={() => {
            setSuccess(null)
            router.push('/')
            router.refresh()
          }}>好的</Button>
        }
      >
        {success}
      </Modal>
    </>
  )
}
