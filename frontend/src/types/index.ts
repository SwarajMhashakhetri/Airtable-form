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

export interface Form {
  _id: string;
  owner: string;
  title: string;
  airtableBaseId: string;
  airtableTableId: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface FormResponse {
  _id: string;
  formId: string;
  airtableRecordId: string;
  answers: Record<string, any>;
  deletedInAirtable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AirtableBase {
  id: string;
  name: string;
}

export interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
}

export interface AirtableField {
  id: string;
  name: string;
  type: string;
  options?: string[];
}
