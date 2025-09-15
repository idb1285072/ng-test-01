import { Injectable } from '@angular/core';
import { User } from './user.model';
import { users } from './user-data';
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

  get getUsers(): User[] {
    return [...this.users];
  }

  filterUsers(term: string): User[] {
    return this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.address.toLowerCase().includes(term.toLowerCase())
    );
  }

  getPaginatedUsers(page: number, perPage: number, term: string): User[] {
    const filtered = this.filterUsers(term);
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }

  getTotalPages(perPage: number, term: string): number {
    return Math.ceil(this.filterUsers(term).length / perPage);
  }

  toggleStatus(id: number) {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.isActive = !user.isActive;
      this.saveToLocalStorage();
    }
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

  deleteUser(id: number) {
    this.users = this.users.filter((u) => u.id !== id);
    this.saveToLocalStorage();
  }
}
