import mongoose, { Schema, Document } from "mongoose";

export interface IZone extends Document {
  mapFileName: string;
  zoneName: string;
  zoneId: string;
  totalSeats: number;
  seatIds: string[];
}

const ZoneSchema: Schema = new Schema({
  mapFileName: { type: String, required: true },
  zoneName: { type: String, required: true },
  zoneId: { type: String, required: true },
  totalSeats: { type: Number, default: 0 },
  seatIds: [{ type: String }],
});

// Compound index: one zone per map
ZoneSchema.index({ mapFileName: 1, zoneId: 1 }, { unique: true });

export default mongoose.model<IZone>("Zone", ZoneSchema);
