import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { UserService } from './services/user.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PushNotificationService } from './services/push-notification.service';
import { onMessage } from 'firebase/messaging';
import { MatSnackBar } from '@angular/material/snack-bar'; 


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ZeroChat';
  private userId: string | null = null;
  private offlineTimeout: any;
  currentTab: string = 'home';
  showFooter = true;


  constructor(
    private userService: UserService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private snackBar: MatSnackBar,
    private push: PushNotificationService
  ) {
    const hideFooterRoutes = ['/notification', '/settings'];
    const hideFooterStartsWith = ['/chat/', '/video-call/'];

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;

        this.showFooter =
          !hideFooterRoutes.includes(url) &&
          !hideFooterStartsWith.some(prefix => url.startsWith(prefix));
      }
    });

  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.userId = sessionStorage.getItem('userId');

    if (!this.userId) {
      console.warn('No user ID found in session!');
      this.router.navigate(['/login']);
      return;
    }

    // Set user online on load
    this.userService.updateUserStatus(this.userId, 'online');

    // Detect tab visibility change (optional for advanced control)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('offline', this.setOffline);
    this.listenForMessages();
  }

  listenForMessages(): void {
    onMessage(this.push['messaging'], (payload) => {
      console.log('📩 Foreground message received:', payload);

      const title = payload.notification?.title || 'New Message';
      const body = payload.notification?.body || '';

      this.snackBar.open(`${title}: ${body}`, 'Close', {
        duration: 4000,
        verticalPosition: 'top',  // Optional: 'top' or 'bottom'
        horizontalPosition: 'right',  // Optional: 'start', 'center', 'end', 'left', 'right'
      });
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('offline', this.setOffline);
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: any) {
    if (this.userId) {
      navigator.sendBeacon(
        '/api/user-status-offline',
        JSON.stringify({ userId: this.userId })
      );
      this.userService.updateUserStatus(this.userId, 'offline');
    }
  }

  handleVisibilityChange = () => {
    if (!this.userId) return;

    if (document.visibilityState === 'hidden') {
      // User switched tab or minimized
      this.offlineTimeout = setTimeout(() => {
        this.userService.updateUserStatus(this.userId!, 'offline');
      }, 10000); // Wait 10 sec before setting offline (optional buffer)
    } else {
      // Back to tab
      clearTimeout(this.offlineTimeout);
      this.userService.updateUserStatus(this.userId, 'online');
    }
  };

  setOffline = () => {
    if (this.userId) {
      this.userService.updateUserStatus(this.userId, 'offline');
    }
  };

  changeTab(tabName: string) {
    this.currentTab = tabName;
    this.router.navigate([`/${tabName}`]);
  }


  handleGalleryUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('File selected:', file);
    }
  }

}
