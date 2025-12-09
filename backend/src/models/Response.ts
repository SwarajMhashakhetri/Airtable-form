import mongoose, { Schema, Document } from 'mongoose';
import { FormResponse } from '../types';

export interface ResponseDocument extends FormResponse { }

const ResponseSchema: Schema = new Schema(
  {
    formId: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    airtableRecordId: { type: String, required: true },
    answers: { type: Schema.Types.Mixed, required: true },
    deletedInAirtable: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ResponseSchema.index({ formId: 1 });
ResponseSchema.index({ airtableRecordId: 1 });

const ResponseModel = mongoose.model<ResponseDocument>('Response', ResponseSchema);
export { ResponseModel }
