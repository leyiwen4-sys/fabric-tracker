import type COS from 'cos-nodejs-sdk-v5'

let cosClient: COS | null = null

async function getCos(): Promise<COS> {
  if (!cosClient) {
    const secretId = process.env.COS_SECRET_ID
    const secretKey = process.env.COS_SECRET_KEY
    if (!secretId || !secretKey) {
      throw new Error('Missing COS_SECRET_ID or COS_SECRET_KEY env vars')
    }
    // 惰性加载，避免 EdgeOne 冷启动加载重型 SDK
    const COSModule = await import('cos-nodejs-sdk-v5')
    cosClient = new COSModule.default({
      SecretId: secretId,
      SecretKey: secretKey,
    })
  }
  return cosClient
}

const BUCKET = process.env.COS_BUCKET || ''
const REGION = process.env.COS_REGION || 'ap-guangzhou'

export async function uploadPhoto(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  const cos = await getCos()
  const key = `uploads/${filename}`

  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }, (err, data) => {
      if (err) return reject(err)
      resolve(`https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`)
    })
  })
}

export async function deletePhoto(url: string): Promise<void> {
  const cos = await getCos()
  // Extract key from URL: https://bucket.cos.region.myqcloud.com/uploads/xxx.jpg → uploads/xxx.jpg
  const key = url.replace(/^https:\/\/[^/]+\/[^/]+\//, '')

  return new Promise((resolve, reject) => {
    cos.deleteObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
    }, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}
