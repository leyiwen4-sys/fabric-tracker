import { put, del } from '@vercel/blob'

export async function uploadPhoto(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  const { url } = await put(`uploads/${filename}`, buffer, {
    access: 'public',
    contentType,
  })
  return url
}

export async function deletePhoto(url: string): Promise<void> {
  await del(url)
}
