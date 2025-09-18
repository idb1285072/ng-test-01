import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../models/interfaces/user.model';
import { UserType } from '../models/enums/user-type';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
})
export class UserEditComponent implements OnInit {
  userForm!: FormGroup;
  isEditMode: boolean = false;
  userId!: number;
  UserType = UserType;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      id: [0],
      name: ['', Validators.required],
      age: [0, [Validators.required, Validators.max(120), Validators.min(18)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      registeredDate: [new Date().toISOString().split('T')[0]],
      isActive: [false],
      role: [UserType.User, Validators.required],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.userId = +id;
      const existingUser = this.userService.getUserById(this.userId);
      if (existingUser) {
        this.userForm.patchValue(existingUser);
      }
    }
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    const user: User = this.userForm.value;

    if (this.isEditMode) {
      this.userService.updateUser(user);
      alert('User updated successfully!');
    } else {
      this.userService.addUser(user);
      alert('User added successfully!');
    }
    this.router.navigate(['/users']);
  }

  onCancel() {
    this.router.navigate(['/users']);
  }
}
