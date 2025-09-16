import { UserType } from "../enums/user-type";

export interface User {
  id: number;
  name: string;
  age: number;
  email: string;
  phone: string;
  address: string;
  registeredDate: string;
  isActive: boolean;
  role: UserType
}
