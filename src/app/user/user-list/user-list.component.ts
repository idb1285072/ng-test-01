import { Component, OnInit } from '@angular/core';
import { User } from '../models/interfaces/user.model';
import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationEvent } from 'src/app/shared/pagination/pagination.component';
import { UserType } from '../models/enums/user-type';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit {
  displayedUsers: User[] = [];
  searchTerm: string = '';
  pageSizes: number[] = [5, 10, 20, 50];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  statusFilter: 'all' | 'active' | 'inactive' = 'active';
  roleFilter: UserType | 'all' = 'all';
  totalUsers: number = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      console.log(params['page'], params['itemsPerPage'], params['search']);
      this.currentPage = +params['page'] || 1;
      this.itemsPerPage = +params['itemsPerPage'] || 5;
      this.searchTerm = params['search'] || '';
      this.statusFilter = params['status'] || 'all';
      this.refreshDisplayedUsers();
    });
  }

  // get users(): User[] {
  //   return this.userService.getUsers();
  // }
  roleOptions: UserType[] = [
    UserType.SuperAdmin,
    UserType.Admin,
    UserType.Moderator,
    UserType.Editor,
    UserType.Author,
    UserType.Contributor,
    UserType.User,
  ];

  changePage(page: number) {
    const totalPages = this.totalPages();
    if (page < 1) {
      this.currentPage = 1;
    } else if (page > totalPages) {
      this.currentPage = totalPages > 0 ? totalPages : 1;
    } else {
      this.currentPage = page;
    }
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  onRoleChange() {
    this.currentPage = 1; // reset pagination
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  get paginatedUsers(): User[] {
    return this.displayedUsers;
  }

  totalPages(): number {
    return this.userService.getTotalPages(this.itemsPerPage, this.searchTerm);
  }

  toggleStatus(user: User) {
    this.userService.toggleStatus(user.id);
    this.refreshDisplayedUsers();
  }

  deleteUser(user: User) {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.userService.deleteUser(user.id);
      const totalPages = this.totalPages();
      if (this.currentPage > totalPages) {
        this.currentPage = totalPages > 0 ? totalPages : 1;
      }
      this.refreshDisplayedUsers();
      this.updateUrl();
    }
  }

  editUser(user: User) {
    this.router.navigate(['/user-edit', user.id]);
  }

  addUser() {
    this.router.navigate(['/user-add']);
  }

  onPaginationChange(event: PaginationEvent) {
    this.itemsPerPage = event.itemsPerPage;
    this.currentPage = event.currentPage;
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  getRoleName(role: UserType) {
    switch (role) {
      case UserType.SuperAdmin:
        return 'SuperAdmin';
      case UserType.Admin:
        return 'Admin';
      case UserType.Moderator:
        return 'Moderator';
      case UserType.Editor:
        return 'Editor';
      case UserType.Author:
        return 'Author';
      case UserType.Contributor:
        return 'Contributor';
      case UserType.User:
        return 'User';
      default:
        return 'Unknown';
    }
  }

  getRoleClass(role: UserType) {
    switch (role) {
      case UserType.SuperAdmin:
        return 'bg-dark';
      case UserType.Admin:
        return 'bg-primary';
      case UserType.Moderator:
        return 'bg-warning';
      case UserType.Editor:
        return 'bg-info';
      case UserType.Author:
        return 'bg-success';
      case UserType.Contributor:
        return 'bg-secondary';
      case UserType.User:
        return 'bg-light text-dark';
    }
  }
  // get totalUsers() {
  //   return this.userService.filterUsers(this.searchTerm).length;
  // }

  // private refreshDisplayedUsers() {
  //   const totalPages = this.totalPages();
  //   if (this.currentPage > totalPages) {
  //     this.currentPage = totalPages > 0 ? totalPages : 1;
  //   }
  //   this.displayedUsers = this.userService.getPaginatedUsers(
  //     this.currentPage,
  //     this.itemsPerPage,
  //     this.statusFilter,
  //     this.searchTerm
  //   ).users;
  // }
  private refreshDisplayedUsers() {
    const result = this.userService.getPaginatedUsers(
      this.currentPage,
      this.itemsPerPage,
      this.statusFilter,
      this.searchTerm,
      this.roleFilter
    );

    this.displayedUsers = result.users;
    this.totalUsers = result.totalUsers;
  }

  // private refreshDisplayedUsers() {
  //   const totalPages = this.totalPages();
  //   if (this.currentPage > totalPages) {
  //     this.currentPage = totalPages > 0 ? totalPages : 1;
  //   }

  //   let users = this.userService.getPaginatedUsers(
  //     this.currentPage,
  //     this.itemsPerPage,
  //     this.searchTerm,
  //     this.statusFilter
  //   );

  //   if (this.statusFilter === 'active') {
  //     users = users.filter((u) => u.isActive);
  //   } else if (this.statusFilter === 'inactive') {
  //     users = users.filter((u) => !u.isActive);
  //   }

  //   this.displayedUsers = users;
  // }

  onStatusChange() {
    this.currentPage = 1;
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  private updateUrl() {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        page: this.currentPage,
        itemsPerPage: this.itemsPerPage,
        search: this.searchTerm || null,
        statusFilter: this.statusFilter,
      },
      queryParamsHandling: 'merge',
    });
  }
}
