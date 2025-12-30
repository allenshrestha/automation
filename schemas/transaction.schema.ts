import { JSONSchemaType } from 'ajv';

export interface Transaction {
  transactionId: string;
  accountNumber: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  balance: number;
  status: string;
}

export const transactionSchema: JSONSchemaType<Transaction> = {
  type: 'object',
  properties: {
    transactionId: { type: 'string' },
    accountNumber: { type: 'string' },
    type: { type: 'string' },
    amount: { type: 'number' },
    description: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    balance: { type: 'number' },
    status: { type: 'string' },
  },
  required: ['transactionId', 'accountNumber', 'type', 'amount', 'date', 'status'],
  additionalProperties: true,
};