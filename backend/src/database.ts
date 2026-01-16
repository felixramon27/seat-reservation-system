import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

const connectDB = async () => {
  try {
    if (process.env.USE_IN_MEMORY === 'true') {
      const mongoServer = await MongoMemoryServer.create()
      const mongoURI = mongoServer.getUri()
      await mongoose.connect(mongoURI)
      console.log('MongoDB connected to in-memory server')
      return
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seat-reservation'
    await mongoose.connect(mongoURI)
    console.log('MongoDB connected to', mongoURI)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB