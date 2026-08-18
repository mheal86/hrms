import { BaseEntity } from './base-model';

export interface Department extends BaseEntity {
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}
