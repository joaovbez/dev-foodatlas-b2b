import { Storage } from '@google-cloud/storage'
import path from 'path'

const storage = new Storage({
  keyFilename: path.join(process.cwd(), 'google-cloud-key.json'),
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
})

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME || '')

export { storage, bucket } 