import { NextRequest, NextResponse } from 'next/server'
import { getFabricById, updateFabric, deleteFabric } from '@/lib/fabrics'
import { verifyToken, getCookieName } from '@/lib/auth'
import { unlink, writeFile, mkdir } from 'fs/promises'
import path from 'path'

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get(getCookieName())?.value
  if (!token) return null
  const payload = await verifyToken(token)
  return payload?.userId || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request)
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
    const fabric = getFabricById(id, userId)
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
    const userId = await getUserId(request)
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

    const formData = await request.formData()
    const updateData: Record<string, any> = {}

    const fields = ['name', 'type', 'unit', 'store', 'purchase_date', 'notes']
    for (const field of fields) {
      const val = formData.get(field)
      if (val !== null) updateData[field] = val
    }

    if (formData.get('width') !== null) {
      updateData.width = parseFloat(formData.get('width') as string)
    }
    if (formData.get('price') !== null) {
      updateData.price = parseFloat(formData.get('price') as string)
    }
    if (formData.get('status') !== null) {
      updateData.status = formData.get('status') as string
    }

    // Handle multi-photo update
    const finalPhotos: string[] = []

    // First, collect existing URLs passed from frontend
    for (let i = 0; ; i++) {
      const url = formData.get(`existing_${i}`)
      if (!url) break
      finalPhotos.push(url as string)
    }

    // Then overlay new uploads at the same positions
    for (let i = 0; i < 3; i++) {
      const photo = formData.get(`photo_${i}`) as File | null
      if (!photo || photo.size === 0) continue

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(photo.type)) continue
      if (photo.size > 10 * 1024 * 1024) continue

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })

      const ext = photo.type.split('/')[1] || 'jpg'
      const filename = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await photo.arrayBuffer())
      await writeFile(path.join(uploadsDir, filename), buffer)
      finalPhotos[i] = `/uploads/${filename}`
    }

    const cleanedPhotos = finalPhotos.filter(p => p).slice(0, 3)
    updateData.photos = JSON.stringify(cleanedPhotos)
    updateData.photo_path = cleanedPhotos[0] || null

    const updated = updateFabric(id, userId, updateData)
    if (!updated) {
      return NextResponse.json(
        { success: false, error: '布料不存在' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request)
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
    const fabric = getFabricById(id, userId)
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
        await unlink(path.join(process.cwd(), 'public', p))
      } catch {
        // File may not exist, ignore
      }
    }

    const deleted = deleteFabric(id, userId)
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
