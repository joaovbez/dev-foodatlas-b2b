import { Storage } from '@google-cloud/storage'

const storage = new Storage()

export const bucket = storage.bucket(process.env.GCS_BUCKET!) 