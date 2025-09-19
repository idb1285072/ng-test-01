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
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { uniqueEmailValidator } from 'src/app/shared/validators/unique-email.validator';
import {
  ChildUserBulkFormInterface,
  UserBulkFormInterface,
} from '../types/user-bulk-form.interface';
import { UserInlineFormInterface } from '../types/user-inline-edit-form.interface';

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
  inlineEditForm!: FormGroup<UserInlineFormInterface>;
  isBulkUpdate: boolean = false;
  bulkForm!: FormGroup<{ users: FormArray<FormGroup<UserBulkFormInterface>> }>;
  bulkFormArray!: FormArray<FormGroup<UserBulkFormInterface>>;
  cellEditData: { userId: number; field: string } | null = null;
  cellEditForms: Map<number, FormGroup> = new Map();

  addColumnUserId: number | null = null;
  addColumnForm!: FormGroup<ChildUserBulkFormInterface>;

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
    this.initQueryParam();
    this.initSearchSubscription();
  }

  onStartCellEdit(userId: number, field: keyof UserInterface) {
    if (this.isBulkUpdate) return;
    this.cellEditData = { userId, field };
  }

  onSaveCellEdit(user: UserInterface, field: keyof UserInterface) {
    const form = this.cellEditForms.get(user.id)!;
    const control = form.get(field)!;

    control.markAsTouched();
    if (control.invalid) return; // Block invalid save

    const updatedUser: UserInterface = { ...user, [field]: control.value };
    this.userService.updateUser(updatedUser);

    this.cellEditData = null;
    this.refreshDisplayedUsers();
  }

  onCancelCellEdit() {
     if (this.cellEditData) {
    const { userId, field } = this.cellEditData;
    const user = this.displayedUsers.find(u => u.id === userId);
    if (user) {
      // this.cellEditForms.get(userId)?.get(field)?.setValue(user[field]);
    }
  }
  this.cellEditData = null;
  }

  onInlineEdit(user: UserInterface) {
    this.inlineEditUserId = user.id;

    this.inlineEditForm = this.fb.group<UserInlineFormInterface>({
      name: this.fb.control(user.name, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      age: this.fb.control(user.age, {
        validators: [
          Validators.required,
          Validators.min(18),
          Validators.max(120),
        ],
        nonNullable: true,
      }),
      email: this.fb.control(user.email, {
        validators: [
          Validators.required,
          Validators.email,
          uniqueEmailValidator(this.userService, user.email),
        ],
        nonNullable: true,
      }),
      phone: this.fb.control(user.phone, { nonNullable: true }),
      address: this.fb.control(user.address, { nonNullable: true }),
      registeredDate: this.fb.control(user.registeredDate, {
        nonNullable: true,
      }),
      role: this.fb.control(user.role, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      isActive: this.fb.control(user.isActive, {
        validators: [Validators.required],
        nonNullable: true,
      }),
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
      const updatedUser: UserInterface = {
        ...user,
        ...this.inlineEditForm.getRawValue(),
      };
      this.userService.updateUser(updatedUser);
      this.onCancelInlineEdit();
      this.refreshDisplayedUsers();
    } else {
      alert('invalid info');
    }
  }

  onBulkUpdateUsers(loadedUsers: UserInterface[]) {
    this.isBulkUpdate = true;

    this.bulkFormArray = this.fb.array(
      loadedUsers.map((user) =>
        this.fb.group({
          id: this.fb.control(user.id, { nonNullable: true }),
          name: this.fb.control(user.name, {
            validators: [Validators.required],
            nonNullable: true,
          }),
          age: this.fb.control(user.age, {
            validators: [
              Validators.required,
              Validators.min(18),
              Validators.max(120),
            ],
            nonNullable: true,
          }),
          email: this.fb.control(user.email, {
            validators: [Validators.required, Validators.email],
            nonNullable: true,
          }),
          phone: this.fb.control(user.phone, { nonNullable: true }),
          address: this.fb.control(user.address, { nonNullable: true }),
          registeredDate: this.fb.control(user.registeredDate, {
            nonNullable: true,
          }),
          role: this.fb.control(user.role, {
            validators: [Validators.required],
            nonNullable: true,
          }),
          isActive: this.fb.control(user.isActive, { nonNullable: true }),
          children: this.fb.array(
            (user.children || []).map((child) =>
              this.fb.group({
                column: this.fb.control(child.column, {
                  validators: [Validators.required],
                  nonNullable: true,
                }),
                value: this.fb.control(child.value, {
                  validators: [Validators.required],
                  nonNullable: true,
                }),
              })
            )
          ),
        })
      )
    );
    this.bulkForm = this.fb.group({
      users: this.bulkFormArray,
    }) as FormGroup<{ users: FormArray<FormGroup<UserBulkFormInterface>> }>;
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

  // getChildrenControls(group: AbstractControl) {
  //   const formGroup = group as FormGroup;
  //   return (formGroup.get('children') as FormArray).controls;
  // }

  // onSaveBulkUpdate() {
  //   if (this.bulkForm.valid) {
  //     const updatedUsers: UserInterface[] = this.bulkForm.value.users;
  //     updatedUsers.forEach((user) => this.userService.updateUser(user));
  //     this.isBulkUpdate = false;
  //     this.refreshDisplayedUsers();
  //   }
  // }

  onSaveBulkUpdate() {
    if (this.bulkForm.invalid) return;
    const updatedUsers: UserInterface[] = [];
    this.bulkFormArray.controls.forEach((userGroup, index) => {
      const originalUser = this.displayedUsers[index];
      const changes: Partial<UserInterface> = {};
      Object.keys(userGroup.controls).forEach((key) => {
        const control = userGroup.get(key)!;
        if (control.dirty) {
          changes[key as keyof UserInterface] = control.value;
        }
      });
      if (Object.keys(changes).length > 0) {
        updatedUsers.push({ ...originalUser, ...changes });
      }
    });
    updatedUsers.forEach((user) => this.userService.updateUser(user));
    this.isBulkUpdate = false;
    this.refreshDisplayedUsers();
  }

  onCancelBulkUpdate() {
    this.isBulkUpdate = false;
  }

  onAddColumn(user: UserInterface) {
    this.addColumnUserId = user.id;
    this.addColumnForm = this.fb.group<ChildUserBulkFormInterface>({
      column: this.fb.control('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      value: this.fb.control('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
    });
  }

  onSaveColumn(user: UserInterface) {
    if (this.addColumnForm.valid) {
      const newColumn = this.addColumnForm.getRawValue();

      if (!user.children) {
        user.children = [];
      }
      user.children.push(newColumn);

      this.userService.updateUser(user);
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

  private initQueryParam() {
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
  }

  private initSearchSubscription() {
    this.searchSubscription = this.searchSubject$
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((text) => {
        this.searchTerm = text;
        this.reload(true);
      });
  }

  private buildCellUpdateForm(user: UserInterface): FormGroup {
    return this.fb.group({
      name: [user.name, Validators.required],
      age: [
        user.age,
        [Validators.required, Validators.min(18), Validators.max(120)],
      ],
      email: [user.email, [Validators.required, Validators.email]],
      phone: [user.phone],
      address: [user.address],
      registeredDate: [user.registeredDate],
      role: [user.role, Validators.required],
      isActive: [user.isActive, Validators.required],
    });
  }
  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }
}
