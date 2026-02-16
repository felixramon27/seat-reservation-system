import mongoose, { Schema, Document } from "mongoose";

export interface ISeatMap extends Document {
  fileName: string;
  displayName: string;
  venue: string;
  level: string;
  levelOrder: number;
  description?: string;
  dimensions: { width: number | null; height: number | null };
  viewBox?: string;
  totalSeats: number;
  zones: string[];
  storageUrl: string;
  status: "draft" | "active" | "archived";
  uploadedAt: Date;
  updatedAt: Date;
}

const SeatMapSchema: Schema = new Schema(
  {
    fileName: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    venue: { type: String, required: true },
    level: { type: String, required: true },
    levelOrder: { type: Number, default: 0 },
    description: { type: String },
    dimensions: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
    viewBox: { type: String },
    totalSeats: { type: Number, default: 0 },
    zones: [{ type: String }],
    storageUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: "updatedAt" } },
);

export default mongoose.model<ISeatMap>("SeatMap", SeatMapSchema);
