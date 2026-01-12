import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

const connectDB = async () => {
  try {
    // Para desarrollo, usar MongoDB en memoria
    const mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)
    console.log('MongoDB in-memory connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB