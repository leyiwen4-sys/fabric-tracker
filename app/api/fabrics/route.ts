import { NextRequest, NextResponse } from 'next/server'
import { getAllFabrics, createFabric, FabricInput } from '@/lib/fabrics'
import { getUserIdFromRequest } from '@/lib/auth'
import { uploadPhoto } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const search = searchParams.get('search') || undefined
    const sort = searchParams.get('sort') || 'created_at_desc'
    const fabrics = await getAllFabrics(userId, { type, search, sort })
    return NextResponse.json({ success: true, data: fabrics })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const formData = await request.formData()

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const unit = formData.get('unit') as string

    // Validate required fields
    if (!name || !type || !unit) {
      return NextResponse.json(
        { success: false, error: '名称、类型、单位为必填项' },
        { status: 400 }
      )
    }

    // Handle multiple photo uploads (max 3)
    const photoPaths: string[] = []
    for (let i = 0; i < 3; i++) {
      const photo = formData.get(`photo_${i}`) as File | null
      if (!photo || photo.size === 0) continue

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { success: false, error: '仅支持 jpg/png/webp 格式' },
          { status: 400 }
        )
      }
      // Validate file size (10MB max)
      if (photo.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: '照片大小不能超过 10MB' },
          { status: 400 }
        )
      }

      const ext = photo.type.split('/')[1] || 'jpg'
      const filename = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await photo.arrayBuffer())
      const url = await uploadPhoto(buffer, filename, photo.type)
      photoPaths.push(url)
    }

    const photos = photoPaths.length > 0 ? JSON.stringify(photoPaths) : '[]'
    const firstPhoto = photoPaths.length > 0 ? photoPaths[0] : null

    const fabricData: FabricInput = {
      user_id: userId,
      name,
      type,
      width: formData.get('width') ? parseFloat(formData.get('width') as string) : null,
      unit,
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
      store: (formData.get('store') as string) || null,
      purchase_date: (formData.get('purchase_date') as string) || null,
      photo_path: firstPhoto,
      photos,
      status: (formData.get('status') as string) || 'idle',
      notes: (formData.get('notes') as string) || null,
    }

    const fabric = await createFabric(fabricData)
    return NextResponse.json({ success: true, data: fabric }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: `添加布料失败: ${message}` },
      { status: 500 }
    )
  }
}
