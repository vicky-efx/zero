import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from './services/user.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ZeroChat';
  constructor(
    private userService: UserService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const userId = sessionStorage.getItem('userId');

    if (!userId) {
      console.warn('No user ID found in session!');
      this.router.navigate(['/login']);
      return;
    }

    this.userService.updateUserStatus(userId, 'online');

    window.addEventListener('beforeunload', () => {
      this.userService.updateUserStatus(userId, 'offline');
    });
  }
}
