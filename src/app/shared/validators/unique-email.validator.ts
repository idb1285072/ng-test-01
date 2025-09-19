import { AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from 'src/app/user/user.service';

// export function uniqueEmailValidator(userService: UserService) {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const emails = userService.getAllEmails();
//     if (emails.includes(control.value.trim())) {
//       return { notUniqueEmail: true };
//     } else {
//       return null;
//     }
//   };
// }

export function uniqueEmailValidator(
  userService: UserService,
  currentUserId?: number
) {
  return (control: AbstractControl): ValidationErrors | null => {
    const users = userService.getAllEmailsWithId(); // [{id, email}]
    const value = typeof control.value === 'string' ? control.value : '';

    const exists = users.some(
      (u) =>
        u.email.trim().toLowerCase() === value.trim().toLowerCase() &&
        u.id !== currentUserId
    );
    console.log('current id ',currentUserId);
    return exists ? { notUniqueEmail: true } : null;
  };
}
