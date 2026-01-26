import { Storage } from '@google-cloud/storage'

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GCP_PROJECT_ID
})

const bucketName = process.env.GCS_BUCKET_NAME || 'seat-svgs'

export const bucket = storage.bucket(bucketName)

export const uploadSVG = async (fileName: string, svgContent: string) => {
  const file = bucket.file(fileName)
  await file.save(svgContent, {
    metadata: {
      contentType: 'image/svg+xml'
    }
  })
  return `https://storage.googleapis.com/${bucketName}/${fileName}`
}

export const getSVG = async (fileName: string) => {
  const file = bucket.file(fileName)
  const [content] = await file.download()
  return content.toString()
}

export const listSVGs = async () => {
  const [files] = await bucket.getFiles()
  return files.map(f => ({ name: f.name, url: `https://storage.googleapis.com/${bucketName}/${f.name}` }))
}

export const deleteSVG = async (fileName: string) => {
  const file = bucket.file(fileName)
  await file.delete({ ignoreNotFound: true })
  return { deleted: fileName }
}