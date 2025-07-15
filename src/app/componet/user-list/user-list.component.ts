import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {
  user: any;
  otherUsers: any[] = [];

  showProfileModal = false;
  selectedUserImage = '';

  constructor(private router: Router, private userService: UserService, @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        this.handleMissingUser();
        return;
      }
      this.loadCurrentUser(userId);
      this.loadOtherUsers(userId);
    } else {
      console.log('Running on the server — sessionStorage not available');
    }
  }

  private handleMissingUser(): void {
    console.error('No user ID found in local storage!');
    this.router.navigate(['/login']);
  }

  private loadCurrentUser(userId: string): void {
    this.userService.userData$.subscribe((data) => {
      this.user = data;
    });

    if (!this.user) {
      this.userService.getUserById(userId).subscribe((data) => {
        this.user = data;
        this.userService.setUserData(data);
      });
    }
  }

  private loadOtherUsers(userId: string): void {
    this.userService.getAllUsersExcludeCurrent(userId).subscribe((users) => {
      this.otherUsers = users;
      console.log('Other users:', this.otherUsers);
    });
  }


  openChat(userId: String): void {
    this.router.navigate(['/chat', userId]);
  }


  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  openUserModal(user: any, event: Event): void {
    event.stopPropagation();

    this.selectedUserImage = user.image
      ? user.image
      : `https://i.pravatar.cc/500?u=${user.id}`;

    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }
}
