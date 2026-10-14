export interface UpdateUserRoleDto {
  userId: string;
  roleId: number;
  expectedVersion?: number;
}
