import { Component, OnDestroy, OnInit } from '@angular/core';

import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationEvent } from 'src/app/shared/pagination/pagination.component';

import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription,
} from 'rxjs';
import { UserInterface } from '../types/user.interface';
import { UserTypeEnum } from '../types/enums/user-type.enum';
import { StatusTypeEnum } from '../types/enums/status-type.enum';
import {
  Form,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { uniqueEmailValidator } from 'src/app/shared/validators/unique-email.validator';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit, OnDestroy {
  private searchSubject$ = new Subject<string>();
  private searchSubscription?: Subscription;
  displayedUsers: UserInterface[] = [];
  totalUsers: number = 0;
  inlineEditUserId: number | null = null;
  inlineEditForm!: FormGroup;
  isBulkUpdate: boolean = false;
  bulkForm!: FormGroup;
  bulkFormArray!: FormArray;

  currentPage: number = 1;
  itemsPerPage: number = 5;
  statusFilter: StatusTypeEnum = StatusTypeEnum.all;
  roleFilter: UserTypeEnum | 'all' = 'all';
  searchTerm: string = '';

  statusOptions = [
    { label: 'all', value: StatusTypeEnum.all },
    { label: 'active', value: StatusTypeEnum.active },
    { label: 'inactive', value: StatusTypeEnum.inactive },
  ];

  roleOptions: UserTypeEnum[] = Object.values(UserTypeEnum).filter(
    (v) => typeof v === 'number'
  ) as UserTypeEnum[];

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.currentPage = +params['page'] || 1;
      this.itemsPerPage = +params['itemsPerPage'] || 5;
      this.searchTerm = params['search'] || '';
      const statusParam = params['status'];
      if (statusParam && !isNaN(+statusParam)) {
        this.statusFilter = +statusParam as StatusTypeEnum;
      } else {
        this.statusFilter = StatusTypeEnum.active;
      }

      if (params['role'] && params['role'] !== 'all') {
        this.roleFilter = +params['role'];
      } else {
        this.roleFilter = 'all';
      }
      this.refreshDisplayedUsers();
    });

    this.searchSubscription = this.searchSubject$
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((text) => {
        this.searchTerm = text;
        this.reload(true);
      });
  }

  onInlineEdit(user: UserInterface) {
    this.inlineEditUserId = user.id;
    this.inlineEditForm = this.fb.group({
      name: [user.name],
      age: [user.age],
      email: [
        user.email,
        [Validators.email, Validators.required, uniqueEmailValidator],
      ],
      phone: [user.phone],
      address: [user.address],
      registeredDate: [user.registeredDate],
      role: [user.role],
      isActive: [user.isActive],
    });
  }

  onCancelInlineEdit() {
    this.inlineEditUserId = null;
    // this.inlineEditForm = null;
  }
  onSaveInlineEdit(user: UserInterface) {
    if (this.inlineEditForm && this.inlineEditForm.valid) {
      const updatedUser = { ...user, ...this.inlineEditForm.value };
      this.userService.updateUser(updatedUser);
      this.onCancelInlineEdit();
      this.refreshDisplayedUsers();
    }
  }

  onBulkUpdateUsers(loadedUsers: UserInterface[]) {
    this.isBulkUpdate = true;
    this.bulkFormArray = this.fb.array(
      loadedUsers.map((user) =>
        this.fb.group({
          id: [user.id],
          name: [user.name],
          age: [user.age],
          email: [user.email],
          phone: [user.phone],
          address: [user.address],
          registeredDate: [user.registeredDate],
          role: [user.role],
          isActive: [user.isActive],
        })
      )
    );

    this.bulkForm = this.fb.group({
      users: this.bulkFormArray,
    });
  }

  onSaveBulkUpdate() {
    if (this.bulkForm.valid) {
      const updatedUsers: UserInterface[] = this.bulkForm.value.users;
      updatedUsers.forEach((user) => this.userService.updateUser(user));
      this.isBulkUpdate = false;
      this.refreshDisplayedUsers();
    }
  }

  onCancelBulkUpdate() {
    this.isBulkUpdate = false;
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

  onToggleStatus(user: UserInterface) {
    this.userService.toggleStatus(user.id);
    this.refreshDisplayedUsers();
    const totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages > 0 ? totalPages : 1;
      this.refreshDisplayedUsers();
      this.updateUrl();
    }
  }

  onAddUser() {
    this.router.navigate(['/user-add']);
  }

  onEditUser(user: UserInterface) {
    this.router.navigate(['/user-edit', user.id]);
  }

  onDeleteUser(user: UserInterface) {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.userService.deleteUser(user.id);
      this.refreshDisplayedUsers();
      const totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
      if (this.currentPage > totalPages) {
        this.currentPage = totalPages > 0 ? totalPages : 1;
        this.refreshDisplayedUsers();
        this.updateUrl();
      }
    }
  }

  onPaginationChange(event: PaginationEvent) {
    this.itemsPerPage = event.itemsPerPage;
    this.currentPage = event.currentPage;
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  getRoleName(role: UserTypeEnum) {
    return UserTypeEnum[role] || 'Unknown';
  }

  getRoleClass(role: UserTypeEnum) {
    const classes: Record<UserTypeEnum, string> = {
      [UserTypeEnum.SuperAdmin]: 'bg-dark',
      [UserTypeEnum.Admin]: 'bg-primary',
      [UserTypeEnum.Moderator]: 'bg-warning',
      [UserTypeEnum.Editor]: 'bg-info',
      [UserTypeEnum.Author]: 'bg-success',
      [UserTypeEnum.Contributor]: 'bg-secondary',
      [UserTypeEnum.User]: 'bg-light text-dark',
    };
    return classes[role] || '';
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
    const { users, totalUsers } = this.userService.getPaginatedUsers(
      this.currentPage,
      this.itemsPerPage,
      this.statusFilter,
      this.searchTerm,
      this.roleFilter
    );
    this.displayedUsers = users;
    this.totalUsers = totalUsers;
  }

  private reload(resetPage: boolean = false) {
    if (resetPage) this.currentPage = 1;
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }
}
