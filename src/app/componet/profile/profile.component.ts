import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  user: any;

  constructor(private router: Router, private userService: UserService) { }

  ngOnInit() {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      this.userService.getUserById(userId).subscribe(data => {
        this.user = data;
        this.userService.setUserData(data); // 🔥 Share user data with other components
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  onImageChange(newImageUrl: string) {
    if (this.user && this.user.id) {
      this.userService.updateUserImage(this.user.id, newImageUrl).then(() => {
        this.user.image = newImageUrl;
        this.userService.setUserData(this.user); // 🔥 Update shared data
      });
    }
  }

  logout() {
    sessionStorage.removeItem("userId");
    this.userService.setUserData(null); // 🔥 Clear cached user data
    this.router.navigate(['/login'], { replaceUrl: true });
  }


  goBack() {
    this.router.navigate(['/user-list']); // ✅ Go back to user list or home
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        // Update Firestore
        this.userService.updateUserImage(this.user.id, imageUrl).then(() => {
          this.user.image = imageUrl;
          this.userService.setUserData(this.user); // Update global state
        });
      };
      reader.readAsDataURL(file); // Convert to base64
    }
  }


}
