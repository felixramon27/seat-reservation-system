import mongoose, { Schema, Document } from "mongoose";

export type SeatStatus = "available" | "selected" | "reserved";

export interface ISeat extends Document {
  id: string;
  status: SeatStatus;
  map?: string;
  externalId?: string;
  expiresAt?: Date;
  zone?: string;
  seatType?: string;
  position?: { x: number; y: number };
  tagName?: string;
}

const SeatSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ["available", "selected", "reserved"],
    default: "available",
  },
  map: { type: String, required: false },
  externalId: { type: String, required: false },
  expiresAt: { type: Date, required: false },
  zone: { type: String, required: false },
  seatType: { type: String, required: false },
  position: {
    x: { type: Number },
    y: { type: Number },
  },
  tagName: { type: String, required: false },
});

export default mongoose.model<ISeat>("Seat", SeatSchema);
