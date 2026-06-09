import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { put } from '@vercel/blob'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fontPath = resolve(__dirname, '..', 'public', 'fonts', 'zhaohuadaziji.ttf')
const buf = readFileSync(fontPath)

console.log(`Uploading ${(buf.length / 1024 / 1024).toFixed(1)} MB...`)
const { url } = await put('fonts/zhaohuadaziji.ttf', buf, {
  access: 'public',
  contentType: 'font/ttf',
})
console.log(`Done: ${url}`)
