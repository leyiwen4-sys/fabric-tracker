import { NextRequest, NextResponse } from 'next/server'
import { getFabricById, updateFabric, deleteFabric } from '@/lib/fabrics'
import { getUserIdFromRequest } from '@/lib/auth'
import { uploadPhoto, deletePhoto } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的 ID' },
        { status: 400 }
      )
    }
    const fabric = await getFabricById(id, userId)
    if (!fabric) {
      return NextResponse.json(
        { success: false, error: '布料不存在' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: fabric })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取详情失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的 ID' },
        { status: 400 }
      )
    }

    // Step 1: Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[PUT] formData parse error:', msg)
      return NextResponse.json(
        { success: false, error: `请求解析失败: ${msg}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {}

    // Step 2: Collect text fields
    // Required fields (name/type/unit) — keep empty strings (client validation prevents them)
    const requiredFields = ['name', 'type', 'unit']
    for (const field of requiredFields) {
      const val = formData.get(field)
      if (val !== null) updateData[field] = val
    }
    // Optional fields — convert empty strings to null so DB preserves NULL
    const optionalFields = ['store', 'purchase_date', 'notes']
    for (const field of optionalFields) {
      const val = formData.get(field)
      if (val !== null) {
        const s = String(val)
        updateData[field] = s !== '' ? s : null
      }
    }

    // Step 3: Numeric fields — use truthiness to avoid parseFloat('') = NaN
    const widthRaw = formData.get('width')
    if (widthRaw !== null) {
      const s = String(widthRaw)
      updateData.width = s !== '' ? parseFloat(s) : null
    }
    const priceRaw = formData.get('price')
    if (priceRaw !== null) {
      const s = String(priceRaw)
      updateData.price = s !== '' ? parseFloat(s) : null
    }

    if (formData.get('status') !== null) {
      updateData.status = formData.get('status') as string
    }

    // Step 4: Photos — only when photo-related fields are present
    const hasPhotoData = formData.get('existing_0') !== null
      || formData.get('photo_0') !== null
      || formData.get('photo_1') !== null
      || formData.get('photo_2') !== null

    if (hasPhotoData) {
      const finalPhotos: string[] = []

      // Collect existing URLs from frontend
      for (let i = 0; ; i++) {
        const url = formData.get(`existing_${i}`)
        if (!url) break
        finalPhotos.push(String(url))
      }

      // Overlay new uploads at same positions
      for (let i = 0; i < 3; i++) {
        const photo = formData.get(`photo_${i}`) as File | null
        if (!photo || photo.size === 0) continue

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(photo.type)) continue
        if (photo.size > 10 * 1024 * 1024) continue

        const ext = photo.type.split('/')[1] || 'jpg'
        const filename = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`
        const buffer = Buffer.from(await photo.arrayBuffer())
        const url = await uploadPhoto(buffer, filename, photo.type)
        finalPhotos[i] = url
      }

      const cleanedPhotos = finalPhotos.filter(p => p).slice(0, 3)
      updateData.photos = JSON.stringify(cleanedPhotos)
      updateData.photo_path = cleanedPhotos[0] || null
    }

    // Step 5: Execute update
    const updated = await updateFabric(id, userId, updateData)
    if (!updated) {
      return NextResponse.json(
        { success: false, error: '布料不存在' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[PUT] update error for id:', error)
    return NextResponse.json(
      { success: false, error: `更新失败: ${message}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的 ID' },
        { status: 400 }
      )
    }

    // Delete associated photo files
    const fabric = await getFabricById(id, userId)
    const photosToDelete: string[] = []
    if (fabric?.photo_path) {
      photosToDelete.push(fabric.photo_path)
    }
    if (fabric?.photos) {
      try {
        const allPhotos: string[] = JSON.parse(fabric.photos)
        for (const p of allPhotos) {
          if (!photosToDelete.includes(p)) {
            photosToDelete.push(p)
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    for (const p of photosToDelete) {
      try {
        await deletePhoto(p)
      } catch {
        // File may not exist, ignore
      }
    }

    const deleted = await deleteFabric(id, userId)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '布料不存在' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    )
  }
}
