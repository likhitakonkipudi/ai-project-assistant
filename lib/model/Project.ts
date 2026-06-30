import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  userId: string;
  name: string;
  date: string;
  time: string;
  documents: Record<string, string>;
  versions: { version: number; timestamp: string }[];
  messageCount: number;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  date: { type: String },
  time: { type: String },
  documents: { type: Schema.Types.Mixed },
  versions: [{ version: Number, timestamp: String }],
  messageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);