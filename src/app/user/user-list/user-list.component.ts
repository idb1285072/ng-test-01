import { Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '../models/interfaces/user.model';
import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationEvent } from 'src/app/shared/pagination/pagination.component';
import { UserType } from '../models/enums/user-type';
import { debounceTime, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit, OnDestroy {
  private searchSubject$ = new Subject<string>();
  private searchSubscription!: Subscription;
  displayedUsers: User[] = [];
  searchTerm: string = '';

  pageSizes: number[] = [5, 10, 20, 50];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  roleFilter: UserType | 'all' = 'all';
  totalUsers: number = 0;

  roleOptions: UserType[] = [
    UserType.SuperAdmin,
    UserType.Admin,
    UserType.Moderator,
    UserType.Editor,
    UserType.Author,
    UserType.Contributor,
    UserType.User,
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.currentPage = +params['page'] || 1;
      this.itemsPerPage = +params['itemsPerPage'] || 5;
      this.searchTerm = params['search'] || '';
      this.statusFilter = params['status'] || 'all';

      if (params['role'] && params['role'] !== 'all') {
        this.roleFilter = +params['role'];
      } else {
        this.roleFilter = 'all';
      }
      this.refreshDisplayedUsers();
    });

    this.searchSubscription = this.searchSubject$
      .pipe(debounceTime(1000))
      .subscribe((text) => {
        this.searchTerm = text;
        this.reload(true);
      });
  }

  totalPages(): number {
    return Math.ceil(this.totalUsers / this.itemsPerPage);
  }

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
    this.reload(true);
  }

  onRoleChange() {
    this.reload(true);
  }

  onStatusChange() {
    this.reload(true);
  }

  onSearchChange(searchTerm: string) {
    this.searchSubject$.next(searchTerm);
  }

  onToggleStatus(user: User) {
    this.userService.toggleStatus(user.id);
    this.refreshDisplayedUsers();
  }

  onAddUser() {
    this.router.navigate(['/user-add']);
  }

  onEditUser(user: User) {
    this.router.navigate(['/user-edit', user.id]);
  }

  onDeleteUser(user: User) {
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

  onPaginationChange(event: PaginationEvent) {
    this.itemsPerPage = event.itemsPerPage;
    this.currentPage = event.currentPage;
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

  private updateUrl() {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        page: this.currentPage,
        itemsPerPage: this.itemsPerPage,
        search: this.searchTerm || null,
        status: this.statusFilter,
        role: this.roleFilter !== 'all' ? this.roleFilter : null,
      },
      queryParamsHandling: 'merge',
    });
  }

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

  private reload(resetPage: boolean = false) {
    if (resetPage) this.currentPage = 1;
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  get paginatedUsers(): User[] {
    return this.displayedUsers;
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
  }
}
