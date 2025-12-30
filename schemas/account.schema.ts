import { JSONSchemaType } from 'ajv';

export interface Account {
  accountNumber: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  interestRate: number;
  openDate: string;
  status: string;
  routingNumber: string;
  currency: string;
}

export const accountSchema: JSONSchemaType<Account> = {
  type: 'object',
  properties: {
    accountNumber: { type: 'string' },
    accountType: { type: 'string' },
    balance: { type: 'number' },
    availableBalance: { type: 'number' },
    interestRate: { type: 'number' },
    openDate: { type: 'string', format: 'date' },
    status: { type: 'string' },
    routingNumber: { type: 'string' },
    currency: { type: 'string' },
  },
  required: ['accountNumber', 'accountType', 'balance', 'status'],
  additionalProperties: true,
};