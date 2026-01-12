import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seat-reservation'
    await mongoose.connect(mongoURI)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB