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

  // getPaginatedUsers(
  //   page: number,
  //   itemsPerPage: number,
  //   status: 'all' | 'active' | 'inactive' = 'all',
  //   searchText: string
  // ): { users: User[]; totalUsers: number } {
  //   //Filtered Users
  //   let filtered = [...this.users];
  //   if (status === 'active') filtered = filtered.filter((u) => u.isActive);
  //   else if (status === 'inactive')
  //     filtered = filtered.filter((u) => !u.isActive);

  //   //Search Filter
  //   if (searchText) {
  //     const lowerSearchText = searchText.toLowerCase();
  //     filtered = filtered.filter(
  //       (u) =>
  //         u.name.toLowerCase().includes(lowerSearchText) ||
  //         u.email.toLowerCase().includes(lowerSearchText) ||
  //         u.phone.toLowerCase().includes(lowerSearchText)
  //     );
  //   }

  //   //Paginated Users
  //   const totalUsers = filtered.length;
  //   const start = (page - 1) * itemsPerPage;
  //   const paginatedUsers = filtered.slice(start, start + itemsPerPage);

  //   return { users: paginatedUsers, totalUsers };
  // }

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

  // getPaginatedUsers(
  //   page: number,
  //   perPage: number,
  //   term: string = '',
  //   statusFilter: 'all' | 'active' | 'inactive' = 'all'
  // ): User[] {
  //   const filtered = this.filterUsers(term, statusFilter);
  //   const start = (page - 1) * perPage;
  //   return filtered.slice(start, start + perPage);
  // }

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

  filterUsers(
    term?: string,
    statusFilter: 'all' | 'active' | 'inactive' = 'all'
  ): User[] {
    let filtered = this.users;

    // Search term filter
    if (term) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(term.toLowerCase()) ||
          user.email.toLowerCase().includes(term.toLowerCase()) ||
          user.address.toLowerCase().includes(term.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((user) => user.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((user) => !user.isActive);
    }

    return filtered;
  }

  // getTotalPages(perPage: number, term: string): number {
  //   return Math.ceil(this.filterUsers(term).length / perPage);
  // }
  getTotalPages(
    perPage: number,
    term: string = '',
    statusFilter: 'all' | 'active' | 'inactive' = 'all'
  ): number {
    return Math.ceil(this.filterUsers(term, statusFilter).length / perPage);
  }
}
