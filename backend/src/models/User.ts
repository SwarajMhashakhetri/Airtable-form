import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser } from '../types';

export interface UserDocument extends IUser { }

const UserSchema: Schema = new Schema(
  {
    airtableUserId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    lastLogin: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<UserDocument>('User', UserSchema);

