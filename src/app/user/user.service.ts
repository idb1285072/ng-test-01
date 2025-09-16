import { Injectable } from '@angular/core';
import { User } from './models/interfaces/user.model';
import { users } from './user-data';
import { UserType } from './models/enums/user-type';
@Injectable({ providedIn: 'root' })
export class UserService {
  private users: User[] = [];
  constructor() {
    const savedData = window.localStorage.getItem('saved-users-data');
    this.users = savedData ? JSON.parse(savedData) : [...users];
    this.saveToLocalStorage();
  }
  private saveToLocalStorage() {
    window.localStorage.setItem('saved-users-data', JSON.stringify(this.users));
  }

  getPaginatedUsers(
    page: number,
    itemsPerPage: number,
    status: 'all' | 'active' | 'inactive' = 'all',
    searchText: string = '',
    roleFilter: UserType | 'all' = 'all'
  ): { users: User[]; totalUsers: number } {
    let filtered = [...this.users];

    // Status filter
    if (status === 'active') filtered = filtered.filter((u) => u.isActive);
    else if (status === 'inactive')
      filtered = filtered.filter((u) => !u.isActive);

    // Search filter
    if (searchText) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          u.phone.toLowerCase().includes(lower)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    const totalUsers = filtered.length;
    const start = (page - 1) * itemsPerPage;
    const paginatedUsers = filtered.slice(start, start + itemsPerPage);

    return { users: paginatedUsers, totalUsers };
  }

  getUserById(id: number) {
    return this.users.find((user) => user.id === id);
  }

  addUser(user: User) {
    user.id =
      this.users.length > 0 ? Math.max(...this.users.map((u) => u.id)) + 1 : 1;
    this.users.push(user);
    this.saveToLocalStorage();
  }

  updateUser(updatedUser: User) {
    const index = this.users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      this.users[index] = updatedUser;
      this.saveToLocalStorage();
    }
  }

  toggleStatus(id: number) {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.isActive = !user.isActive;
      this.saveToLocalStorage();
    }
  }

  deleteUser(id: number) {
    this.users = this.users.filter((u) => u.id !== id);
    this.saveToLocalStorage();
  }
}
