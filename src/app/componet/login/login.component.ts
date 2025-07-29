import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage.service';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private storageService: StorageService, private router: Router, private userService: UserService, public push: PushNotificationService) { }

  ngOnInit() {
    const userId = this.storageService.getSessionItem("userId");
    if (userId) {
      this.router.navigate(['/home'], { replaceUrl: true });
    }
  }


  async onLogin() {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill all fields correctly.';
      return;
    }

    try {
      const user = await this.userService.loginUser(this.email, this.password);

      if (!user || !user.id) {
        this.errorMessage = 'Invalid email or password.';
        return;
      }

      sessionStorage.setItem("userId", user.id);

      this.push.requestPermission(user.id);

      this.router.navigate(['/home'], { replaceUrl: true });
    } catch (err: any) {
      this.errorMessage = 'Invalid email or password.';
    }
  }


}
