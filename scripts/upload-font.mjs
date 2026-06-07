import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import COS from 'cos-nodejs-sdk-v5'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
const env = {}
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  env[t.slice(0, i)] = t.slice(i + 1)
}

const cos = new COS({ SecretId: env.COS_SECRET_ID, SecretKey: env.COS_SECRET_KEY })
const fontPath = resolve(__dirname, '..', 'public', 'fonts', 'zhaohuadaziji.ttf')
const buf = readFileSync(fontPath)

console.log(`Uploading ${(buf.length / 1024 / 1024).toFixed(1)} MB...`)
cos.putObject({
  Bucket: env.COS_BUCKET,
  Region: env.COS_REGION,
  Key: 'fonts/zhaohuadaziji.ttf',
  Body: buf,
  ContentType: 'font/ttf',
}, (err, data) => {
  if (err) { console.error(err); process.exit(1) }
  const url = `https://${env.COS_BUCKET}.cos.${env.COS_REGION}.myqcloud.com/fonts/zhaohuadaziji.ttf`
  console.log(`Done: ${url}`)
})
