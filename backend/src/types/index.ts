export type Operator = 'equals' | 'notEquals' | 'contains';
export type LogicOperator = 'AND' | 'OR';

export interface Condition {
  questionKey: string;
  operator: Operator;
  value: any;
}

export interface ConditionalRules {
  logic: LogicOperator;
  conditions: Condition[];
}

export interface Question {
  questionKey: string;
  airtableFieldId: string;
  label: string;
  type: 'singleLineText' | 'multilineText' | 'singleSelect' | 'multipleSelects' | 'multipleAttachments';
  required: boolean;
  options?: string[];
  conditionalRules?: ConditionalRules | null;
}

export interface FormDefinition {
  _id?: string;
  owner: string;
  title: string;
  airtableBaseId: string;
  airtableTableId: string;
  questions: Question[];
  createdAt?: Date;
  updatedAt?: Date;
  webhookId: string;
  webhookCur?: number;
}

export interface FormResponse {
  _id?: string;
  formId: string;
  airtableRecordId: string;
  answers: Record<string, any>;
  deletedInAirtable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AirtableUser {
  id: string;
  email: string;
  name?: string;
}

export interface User {
  _id?: string;
  airtableUserId: string;
  email: string;
  name?: string;
  accessToken: string;
  refreshToken?: string;
  lastLogin: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
