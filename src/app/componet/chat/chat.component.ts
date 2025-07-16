import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, RouterModule, PickerModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  messages: any[] = [];
  newMessage = '';
  subscription!: Subscription;
  currentUserId = '';
  selectedUserId = '';
  userName: string = '';
  menuOpen = false;
  isBlocked = false;
  isCleared = false;
  chatId = '';
  showEmojiPicker = false;
  emojiPickerRef!: ElementRef;
  menuRef!: ElementRef;
  userStatusText: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private userService: UserService
  ) { }

  @ViewChild('messageList') messageList!: ElementRef;
  @ViewChild('emojiPickerContainer') emojiPickerContainer!: ElementRef;
  @ViewChild('menuContainer') menuContainer!: ElementRef;

  ngOnInit(): void {
    this.currentUserId = sessionStorage.getItem('userId') || '';
    this.selectedUserId = this.route.snapshot.paramMap.get('id') || '';
    this.chatId = this.chatService.generateChatId(this.currentUserId, this.selectedUserId);

    this.userService.getUserById(this.selectedUserId).subscribe(user => {
      this.userName = user?.name || 'Unknown';

      if (user?.status === 'online') {
        this.userStatusText = 'online';
      } else {
        this.userStatusText = this.formatLastSeen(user?.lastSeen);
      }
    });

    this.checkIfBlocked();

    this.chatService.isChatCleared(this.currentUserId, this.chatId).then(cleared => {
      this.isCleared = cleared;

      if (!cleared) {
        this.loadMessages();
      } else {
        this.messages = [];
      }
    });
  }


  loadMessages() {
    this.subscription = this.chatService
      .getMessages(this.currentUserId, this.selectedUserId)
      .subscribe(msgs => {
        this.messages = msgs;
        this.scrollToBottom();
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      try {
        this.messageList.nativeElement.scrollTop = this.messageList.nativeElement.scrollHeight;
      } catch (err) {
        console.log(err);
      }
    }, 100);
  }

  sendMessage(): void {
    const trimmed = this.newMessage.trim();
    if (!trimmed) return;

    this.chatService
      .sendMessage(this.currentUserId, this.selectedUserId, trimmed)
      .then(() => {
        this.newMessage = '';
      })
      .catch(err => {
        console.error(err);
        alert(err);
      });
  }

  sendImage(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;

        this.chatService
          .sendMessage(this.currentUserId, this.selectedUserId, undefined, base64String)
          .then(() => { })
          .catch(err => {
            console.error(err);
            alert(err);
          });
      };
      reader.readAsDataURL(file);
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  goBack(): void {
    this.router.navigate(['/user-list']);
  }

  clearChat() {
    this.chatService.clearChat(this.currentUserId, this.chatId).then(() => {
      this.isCleared = true;
      this.messages = [];
      this.menuOpen = false;
    });
  }

  restoreChat() {
    this.chatService.restoreChat(this.currentUserId, this.chatId).then(() => {
      this.isCleared = false;
      this.loadMessages();
      this.menuOpen = false;
    });
  }

  blockUser() {
    if (this.isBlocked) {
      this.chatService.unblockUser(this.currentUserId, this.selectedUserId).then(() => {
        this.isBlocked = false;
        console.log('User unblocked');
        this.menuOpen = false;
      });
    } else {
      this.chatService.blockUser(this.currentUserId, this.selectedUserId).then(() => {
        this.isBlocked = true;
        console.log('User blocked');
        this.menuOpen = false;
      });
    }
  }

  checkIfBlocked() {
    this.chatService.isUserBlocked(this.currentUserId, this.selectedUserId).then(isBlocked => {
      this.isBlocked = isBlocked;
    });
  }

  addEmoji(event: any) {
    this.newMessage += event.emoji.native;
  }

  toggleEmojiPicker(event: MouseEvent) {
    event.stopPropagation(); // 👈 important!
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInsideMenu = this.menuContainer?.nativeElement.contains(event.target);
    const clickedInsideEmoji = this.emojiPickerContainer?.nativeElement.contains(event.target);

    if (!clickedInsideMenu && this.menuOpen) {
      this.menuOpen = false;
    }

    if (!clickedInsideEmoji && this.showEmojiPicker) {
      this.showEmojiPicker = false;
    }
  }

  formatLastSeen(lastSeen: number | undefined): string {
    if (!lastSeen) {
      return 'last seen a while ago';
    }

    const lastDate = new Date(lastSeen);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const lastSeenDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

    let timeString = lastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (lastSeenDay.getTime() === today.getTime()) {
      return `last seen today at ${timeString}`;
    } else if (lastSeenDay.getTime() === yesterday.getTime()) {
      return `last seen yesterday at ${timeString}`;
    } else {
      const dateString = lastDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
      return `last seen on ${dateString} at ${timeString}`;
    }
  }


}
