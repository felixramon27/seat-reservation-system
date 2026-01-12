import mongoose, { Schema, Document } from 'mongoose'

export type SeatStatus = 'available' | 'selected' | 'reserved'

export interface ISeat extends Document {
  id: string
  status: SeatStatus
}

const SeatSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  status: { type: String, enum: ['available', 'selected', 'reserved'], default: 'available' }
})

export default mongoose.model<ISeat>('Seat', SeatSchema)