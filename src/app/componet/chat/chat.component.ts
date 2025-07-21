import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { format, isToday, isYesterday, isThisWeek, differenceInCalendarDays } from 'date-fns';

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
  statusColor = '';
  selectedImageUrl: string | null = null;
  showImageModal = false;
  pressTimer: any;
  pressDuration = 800;
  showUnsendModal = false;
  messageToUnsend: any = null;
  groupedMessages: { date: string, messages: any[] }[] = [];
  groupedMessageKeys: string[] = [];
  replyToMessage: any = null;
  touchStartX: number = 0;
  touchEndX: number = 0;


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
        this.statusColor = '#138f53';
      } else {
        this.userStatusText = this.formatLastSeen(user?.lastSeen);
        this.statusColor = 'black';
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
      .subscribe(async msgs => {
        const grouped = this.groupMessagesByDate(msgs);
        this.groupedMessages = grouped;
        this.scrollToBottom();

        await this.chatService.markMessagesAsRead(this.selectedUserId, this.currentUserId);
      });
  }

  groupMessagesByDate(messages: any[]): { date: string, messages: any[] }[] {
    const groupedMap = new Map<string, any[]>();

    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.setDate(now.getDate() - 1)).toDateString();

    for (let msg of messages) {
      const msgDate = new Date(msg.timestamp?.seconds * 1000).toDateString();

      let key = '';
      if (msgDate === today) {
        key = 'Today';
      } else if (msgDate === yesterday) {
        key = 'Yesterday';
      } else {
        const dateObj = new Date(msg.timestamp?.seconds * 1000);
        key = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
      }

      if (!groupedMap.has(key)) {
        groupedMap.set(key, []);
      }
      groupedMap.get(key)!.push(msg);
    }

    const result = [];
    for (let [date, msgs] of groupedMap.entries()) {
      result.push({ date, messages: msgs });
    }

    return result;
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

    const messagePayload = {
      from: this.currentUserId,
      to: this.selectedUserId,
      content: trimmed,
      timestamp: new Date(),
      replyTo: this.replyToMessage ? {
        content: this.replyToMessage.content,
        from: this.replyToMessage.from,
        timestamp: this.replyToMessage.timestamp,
      } : null
    };

    this.chatService.sendMessage(this.currentUserId, this.selectedUserId, messagePayload)
      .then(() => {
        this.newMessage = '';
        this.replyToMessage = null;
      })
      .catch(err => {
        console.error(err);
        alert(err);
      });
  }

  setReplyTo(msg: any) {
    this.replyToMessage = msg;
  }

  cancelReply() {
    this.replyToMessage = null;
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

  toggleEmojiPicker(event: Event): void {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any): void {
    this.newMessage += event.emoji.native;
    this.showEmojiPicker = false;
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

  formatTimestamp(ts: any): string {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  openImageModal(imageUrl: string) {
    this.selectedImageUrl = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal() {
    this.showImageModal = false;
    this.selectedImageUrl = null;
  }

  sendMeetInvite() {
    const randomPart = Math.random().toString(36).substring(2, 8); // e.g., "4kz8fe"
    const roomId = `${this.currentUserId}_${randomPart}`;          // e.g., "12_4kz8fe"
    const meetLink = `/video-call/${roomId}`;

    const message = {
      from: this.currentUserId,
      to: this.selectedUserId,
      content: meetLink,
      timestamp: new Date().toISOString()
    };

    this.chatService.sendMessage(this.currentUserId, this.selectedUserId, meetLink)
      .then(() => {
        console.log("Meet invite sent:", meetLink);
      })
      .catch(err => {
        console.error("Error sending invite:", err);
      });
  }

  extractVideoCallPath(content: string): string {
    const match = content.match(/\/video-call\/[a-zA-Z0-9_\-]+/);
    return match ? match[0] : '/';
  }

  startPress(message: any) {
    // Only allow long press on your own non-unsent messages
    if (message.from !== this.currentUserId || message.unsent) return;

    this.pressTimer = setTimeout(() => {
      this.messageToUnsend = message;
      this.showUnsendModal = true;
    }, 600); // 600ms = long press
  }

  cancelPress() {
    clearTimeout(this.pressTimer);
  }

  closeUnsendModal() {
    this.showUnsendModal = false;
    this.messageToUnsend = null;
  }

  unsendConfirmed() {
    if (!this.messageToUnsend) return;

    this.chatService.unsendMessage(this.chatId, this.messageToUnsend).then(() => {
      this.closeUnsendModal();
    }).catch(err => {
      console.error("Unsend failed", err);
      this.closeUnsendModal();
    });
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;

    const currentDate = new Date(this.messages[index].timestamp);
    const prevDate = new Date(this.messages[index - 1].timestamp);

    return currentDate.toDateString() !== prevDate.toDateString();
  }

  formatDateSeparator(timestamp: any): string {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate?.() || timestamp;

      if (isToday(date)) {
        return 'Today';
      }

      if (isYesterday(date)) {
        return 'Yesterday';
      }

      const daysAgo = differenceInCalendarDays(new Date(), date);

      if (daysAgo <= 6) {
        return format(date, 'EEEE'); // e.g., "Monday", "Thursday"
      }

      return format(date, 'dd MMM yyyy'); // e.g., "12 Jul 2025"

    } catch (error) {
      console.error('Date parsing failed:', timestamp, error);
      return '';
    }
  }

  enlargeImage(url: string) {
    window.open(url, '_blank');
  }

  handleTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  handleTouchMove(event: TouchEvent, msg: any) {
    this.touchEndX = event.changedTouches[0].screenX;

    if (this.touchEndX - this.touchStartX > 100 && msg.from !== this.currentUserId) {
      this.setReplyTo(msg);

      const target = event.target as HTMLElement;
      target.classList.add('swipe-reply');  // ✅ no TS error now
    }
  }



  handleTouchEnd() {
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

}
