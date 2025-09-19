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
  AbstractControl,
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
  addColumnUserId: number | null = null;
  addColumnForm!: FormGroup;

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
      name: [user.name, Validators.required],
      age: [user.age, [Validators.required, Validators.min(1)]],
      email: [
        user.email,
        [Validators.required, Validators.email, uniqueEmailValidator(this.userService)],
      ],
      phone: [user.phone],
      address: [user.address],
      registeredDate: [user.registeredDate],
      role: [user.role, Validators.required],
      isActive: [user.isActive, Validators.required],
    });
  }

  // get inlineChildren(): FormArray {
  //   return this.inlineEditForm.get('children') as FormArray;
  // }

  // addInlineChild() {
  //   this.inlineChildren.push(
  //     this.fb.group({
  //       column: ['', Validators.required],
  //       value: ['', Validators.required],
  //     })
  //   );
  // }

  // removeInlineChild(index: number) {
  //   this.inlineChildren.removeAt(index);
  // }

  onCancelInlineEdit() {
    this.inlineEditUserId = null;
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
          children: this.fb.array(
            (user.children || []).map((child) =>
              this.fb.group({
                column: [child.column, Validators.required],
                value: [child.value, Validators.required],
              })
            )
          ),
        })
      )
    );

    this.bulkForm = this.fb.group({
      users: this.bulkFormArray,
    });
  }

  // addBulkChild(userIndex: number) {
  //   const children = this.bulkFormArray
  //     .at(userIndex)
  //     .get('children') as FormArray;
  //   children.push(
  //     this.fb.group({
  //       column: ['', Validators.required],
  //       value: ['', Validators.required],
  //     })
  //   );
  // }

  // removeBulkChild(userIndex: number, childIndex: number) {
  //   const children = this.bulkFormArray
  //     .at(userIndex)
  //     .get('children') as FormArray;
  //   children.removeAt(childIndex);
  // }
  
  getChildrenControls(group: AbstractControl) {
    const formGroup = group as FormGroup;
    return (formGroup.get('children') as FormArray).controls;
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

  onAddColumn(user: UserInterface) {
    this.addColumnUserId = user.id;
    this.addColumnForm = this.fb.group({
      column: ['', Validators.required],
      value: ['', Validators.required],
    });
  }

  onSaveColumn(user: UserInterface) {
    if (this.addColumnForm.valid) {
      const newColumn = this.addColumnForm.value;

      if (!user.children) {
        user.children = [];
      }
      user.children.push(newColumn);

      this.userService.updateUser(user); // persist changes
      this.addColumnUserId = null;
      this.refreshDisplayedUsers();
    }
  }

  onCancelColumn() {
    this.addColumnUserId = null;
  }

  chunkChildren(children: { column: string; value: string }[], size: number) {
    const chunks = [];
    for (let i = 0; i < children.length; i += size) {
      chunks.push(children.slice(i, i + size));
    }
    return chunks;
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
