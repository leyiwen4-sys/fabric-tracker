import { NextRequest, NextResponse } from 'next/server'
import { getFabricById, updateFabric, deleteFabric } from '@/lib/fabrics'
import { unlink, writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的 ID' },
        { status: 400 }
      )
    }
    const fabric = getFabricById(id)
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

    // Handle photo update
    const photo = formData.get('photo') as File | null
    if (photo && photo.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { success: false, error: '仅支持 jpg/png/webp 格式' },
          { status: 400 }
        )
      }
      if (photo.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: '照片大小不能超过 10MB' },
          { status: 400 }
        )
      }

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })

      const ext = photo.type.split('/')[1] || 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await photo.arrayBuffer())
      await writeFile(path.join(uploadsDir, filename), buffer)
      updateData.photo_path = `/uploads/${filename}`
    }

    const updated = updateFabric(id, updateData)
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
    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的 ID' },
        { status: 400 }
      )
    }

    // Delete associated photo file
    const fabric = getFabricById(id)
    if (fabric?.photo_path) {
      const filePath = path.join(process.cwd(), 'public', fabric.photo_path)
      try {
        await unlink(filePath)
      } catch {
        // File may not exist, ignore
      }
    }

    const deleted = deleteFabric(id)
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
