import { inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { UserService } from 'src/app/user/user.service';

export function uniqueEmailValidator() {
  return (control: AbstractControl) => {
    const userService = inject(UserService);
    const emails = userService.getAllEmails();
    if (emails.includes(control.value)) {
      return { notUniqueEmail: true };
    } else {
      return null;
    }
  };
}
