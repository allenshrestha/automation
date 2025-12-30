import { JSONSchemaType } from 'ajv';

export interface Member {
  id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ssn?: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  memberSince: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  accounts?: Array<{
    accountNumber: string;
    accountType: string;
    balance: number;
  }>;
}

export const memberSchema: JSONSchemaType<Member> = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    accountNumber: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string' },
    ssn: { type: 'string', nullable: true },
    dateOfBirth: { type: 'string', format: 'date' },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zip: { type: 'string' },
        country: { type: 'string' },
      },
      required: ['street', 'city', 'state', 'zip', 'country'],
    },
    memberSince: { type: 'string', format: 'date-time' },
    status: { type: 'string', enum: ['Active', 'Inactive', 'Suspended'] },
    accounts: {
      type: 'array',
      nullable: true,
      items: {
        type: 'object',
        properties: {
          accountNumber: { type: 'string' },
          accountType: { type: 'string' },
          balance: { type: 'number' },
        },
        required: ['accountNumber', 'accountType', 'balance'],
      },
    },
  },
  required: ['id', 'accountNumber', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'address', 'memberSince', 'status'],
  additionalProperties: true,
};