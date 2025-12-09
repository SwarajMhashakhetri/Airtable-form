import mongoose, { Schema, Document } from 'mongoose';
import { FormDefinition } from '../types';

export interface FormDocument extends FormDefinition { }

const ConditionSchema = new Schema({
  questionKey: { type: String, required: true },
  operator: { type: String, enum: ['equals', 'notEquals', 'contains'], required: true },
  value: { type: Schema.Types.Mixed, required: true },
}, { _id: false });

const ConditionalRulesSchema = new Schema({
  logic: { type: String, enum: ['AND', 'OR'], required: true },
  conditions: [ConditionSchema],
}, { _id: false });

const QuestionSchema = new Schema({
  questionKey: { type: String, required: true },
  airtableFieldId: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelects', 'multipleAttachments'],
    required: true
  },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
  conditionalRules: { type: ConditionalRulesSchema, default: null },
}, { _id: false });


const FormSchema: Schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    airtableBaseId: { type: String, required: true },
    airtableTableId: { type: String, required: true },
    questions: [QuestionSchema],
    webhookId: { type: String },
    webhookCursor: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<FormDocument>('Form', FormSchema);

