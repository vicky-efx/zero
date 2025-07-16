import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Observable, Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';

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
  private userSub!: Subscription;

  constructor(private router: Router, private userService: UserService, private chatService: ChatService, @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        this.handleMissingUser();
        return;
      }

      this.loadCurrentUser(userId);
      this.loadOtherUsers(userId);

      // Update status to online
      this.userService.updateUserStatus(userId, 'online');

      // Set offline on window close
      window.addEventListener('beforeunload', () => {
        this.userService.updateUserStatus(userId, 'offline');
      });
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
    this.userService.getAllUsersExcludeCurrent(userId).subscribe(async (users) => {
      this.otherUsers = users;

      for (const user of this.otherUsers) {
        const info = await this.userService.getLastMessageInfo(userId, user.id);
        user.lastMessage = info.lastMessage;
        user.lastTime = info.lastTime;
        user.unreadCount = info.unreadCount;
      }
    });
  }


  openChat(userId: string): void {
    const currentUserId = sessionStorage.getItem('userId') || '';

    // Call your ChatService to mark messages as read
    this.chatService.markMessagesAsRead(currentUserId, userId)
      .then(() => {
        this.router.navigate(['/chat', userId]);
      })
      .catch(err => {
        console.error('Error marking messages as read:', err);
        this.router.navigate(['/chat', userId]); // Navigate anyway
      });
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

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}
