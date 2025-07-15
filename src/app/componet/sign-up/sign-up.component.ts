import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterLink,CommonModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  email = '';
  password = '';
  name = '';
  phoneNumber = ''
  errorMessage: string = '';

  constructor(private router: Router, private userService: UserService) { }

  async onSignUp() {
    this.errorMessage = ''; // Clear previous error

    const newUser = {
      name: this.name,
      email: this.email,
      password: this.password,
      phoneNumber: this.phoneNumber
    };

    this.userService.SignUp(newUser).subscribe({
      next: (docRef: any) => {
        sessionStorage.setItem("userId", docRef.id);
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.errorMessage = err.message;
      }
    });
  }


}
