export type InternalUserRole = 'DOCTOR' | 'FRONT_DESK';

export interface AdminCreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: InternalUserRole;
}

export interface AdminUserResponse {
  id: number;
  username: string;
  email: string;
  role: InternalUserRole;
  enabled: boolean;
}
