import { CreatePerson } from '../../../../models/common.model';

export interface CreateUser extends CreatePerson {
  username: string;
  password: string;
  role: { name: string };
}
