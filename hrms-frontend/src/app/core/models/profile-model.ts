import { Employee } from './employee-model';
import { BaseDocument } from './base-model';

export interface ProfileData extends BaseDocument {
  username: string;
  role: { _id: string; name: string };
  employee?: Employee | null;
}

export interface UpdateProfilePayload {
  phone?: string;
  address?: string;
}
