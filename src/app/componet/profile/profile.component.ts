import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  user: any;
  editableUser: any = {};
  editing = false;
  showLogoutConfirm = false;


  constructor(private router: Router, private userService: UserService) { }

  ngOnInit() {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      this.userService.getUserById(userId).subscribe(data => {
        this.user = data;
        this.editableUser = { ...data };
        this.userService.setUserData(data);
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  onImageChange(newImageUrl: string) {
    if (this.user && this.user.id) {
      this.userService.updateUserImage(this.user.id, newImageUrl).then(() => {
        this.user.image = newImageUrl;
        this.userService.setUserData(this.user);
      });
    }
  }

  logout() {
    const confirmLogout = confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;

    if (this.user && this.user.id) {
      this.userService.updateUserStatus(this.user.id, 'offline').then(() => {
        sessionStorage.removeItem("userId");
        this.userService.setUserData(null);
        this.router.navigate(['/login'], { replaceUrl: true });
      });
    } else {
      sessionStorage.removeItem("userId");
      this.userService.setUserData(null);
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  confirmLogout() {
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }



  goBack() {
    this.router.navigate(['/user-list']);
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        this.userService.updateUserImage(this.user.id, imageUrl).then(() => {
          this.user.image = imageUrl;
          this.userService.setUserData(this.user);
        });
      };
      reader.readAsDataURL(file);
    }
  }

  saveEdits() {
    const { name, phoneNumber, age, bio } = this.editableUser;
    this.userService.updateUserDetails(this.user.id, { name, phoneNumber, age, bio }).then(() => {
      this.user = { ...this.user, ...this.editableUser };
      this.userService.setUserData(this.user);
      this.editing = false;
    });
  }

  cancelEdits() {
    this.editing = false;
  }

  editProfile() {
    this.editableUser = { ...this.user };
    this.editing = true;
  }

}
