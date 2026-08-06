import { Employee } from './employee-model';

export interface ProfileData {
  _id: string;
  username: string;
  role: { _id: string; name: string };
  employee?: Employee | null;
}

export interface UpdateProfilePayload {
  phone?: string;
  address?: string;
}
