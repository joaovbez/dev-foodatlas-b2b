import { Storage } from '@google-cloud/storage'

<<<<<<< HEAD
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GBQ_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
});
=======
const storage = new Storage()
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5

export const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET!) 
