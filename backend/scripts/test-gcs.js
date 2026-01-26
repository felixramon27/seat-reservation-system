require('dotenv').config()
const { Storage } = require('@google-cloud/storage')

async function main() {
  const projectId = process.env.GCP_PROJECT_ID
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const bucketName = process.env.GCS_BUCKET_NAME

  if (!bucketName) {
    console.error('GCS_BUCKET_NAME not set in .env')
    process.exit(2)
  }

  console.log('Using project:', projectId)
  console.log('Using key file:', keyFile)
  console.log('Using bucket:', bucketName)

  const storage = new Storage({ keyFilename: keyFile, projectId })
  const bucket = storage.bucket(bucketName)

  try {
    console.log('Listing files in bucket...')
    const [files] = await bucket.getFiles()
    console.log('Files:', files.map(f => f.name))
  } catch (err) {
    console.error('Error listing files:', err)
  }

  const testName = `test-${Date.now()}.svg`
  const testContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#fff"/></svg>'

  try {
    console.log('Uploading', testName)
    const file = bucket.file(testName)
    await file.save(testContent, { metadata: { contentType: 'image/svg+xml' } })
    console.log('Uploaded to:', `https://storage.googleapis.com/${bucketName}/${testName}`)
  } catch (err) {
    console.error('Upload error:', err)
    process.exit(3)
  }

  try {
    console.log('Downloading back', testName)
    const file = bucket.file(testName)
    const [buf] = await file.download()
    console.log('Downloaded content length:', buf.length)
  } catch (err) {
    console.error('Download error:', err)
    process.exit(4)
  }

  try {
    console.log('Deleting', testName)
    await bucket.file(testName).delete({ ignoreNotFound: true })
    console.log('Deleted', testName)
  } catch (err) {
    console.error('Delete error:', err)
  }

  console.log('GCS test finished')
}

main().catch(err => { console.error('Unexpected error', err); process.exit(1) })
