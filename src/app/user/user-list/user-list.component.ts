import { Component, OnInit } from '@angular/core';
import { User } from '../user.model';
import { Router } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit {
  searchTerm: string = '';
  pageSizes: number[] = [5, 10, 20, 50];
  currentPage: number = 1;
  itemsPerPage: number = 5;

  constructor(private router: Router, private userService: UserService) {}
  ngOnInit(): void {}

  get users(): User[] {
    return this.userService.getUsers;
  }

  // changePage(page: number) {
  //   this.currentPage = page;
  // }
  changePage(page: number) {
    const totalPages = this.totalPages();
    if (page < 1) {
      this.currentPage = 1;
    } else if (page > totalPages) {
      this.currentPage = totalPages > 0 ? totalPages : 1;
    } else {
      this.currentPage = page;
    }
  }
  onItemsPerPageChange() {
    this.currentPage = 1;
  }

  get paginatedUsers(): User[] {
    return this.userService.getPaginatedUsers(
      this.currentPage,
      this.itemsPerPage,
      this.searchTerm
    );
  }

  totalPages(): number {
    return this.userService.getTotalPages(this.itemsPerPage, this.searchTerm);
  }

  toggleStatus(user: User) {
    this.userService.toggleStatus(user.id);
  }

  deleteUser(user: User) {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.userService.deleteUser(user.id);

      const totalPages = this.totalPages();
      if (this.currentPage > totalPages) {
        this.currentPage = totalPages > 0 ? totalPages : 1;
      }
    }
  }

  editUser(user: User) {
    this.router.navigate(['/user-edit', user.id]);
  }

  addUser() {
    this.router.navigate(['/user-add']);
  }
}
