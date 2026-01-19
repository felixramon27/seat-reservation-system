import mongoose, { Schema, Document } from 'mongoose'

export type SeatStatus = 'available' | 'selected' | 'reserved'

export interface ISeat extends Document {
  id: string
  status: SeatStatus
  map?: string
  externalId?: string
}

const SeatSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  status: { type: String, enum: ['available', 'selected', 'reserved'], default: 'available' },
  map: { type: String, required: false },
  externalId: { type: String, required: false }
})

export default mongoose.model<ISeat>('Seat', SeatSchema)