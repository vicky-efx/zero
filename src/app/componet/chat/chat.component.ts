import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, RouterModule],
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private userService: UserService
  ) { }

  @ViewChild('messageList') messageList!: ElementRef;

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngOnInit(): void {
    this.currentUserId = sessionStorage.getItem('userId') || '';
    this.selectedUserId = this.route.snapshot.paramMap.get('id') || '';

    this.userService.getUserById(this.selectedUserId).subscribe(user => {
      this.userName = user?.name || 'Unknown';
    });

    this.subscription = this.chatService
      .getMessages(this.currentUserId, this.selectedUserId)
      .subscribe(msgs => {
        this.messages = msgs;
        this.scrollToBottom();
      });
  }

  scrollToBottom() {
    try {
      this.messageList.nativeElement.scrollTop = this.messageList.nativeElement.scrollHeight;
    } catch (err) {
      console.log(err);
    }
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  sendMessage(): void {
    const trimmed = this.newMessage.trim();
    if (!trimmed) return;

    this.chatService
      .sendMessage(this.currentUserId, this.selectedUserId, trimmed)
      .then(() => {
        this.newMessage = '';
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
          .then(() => {
          });
      };
      reader.readAsDataURL(file);
    }
  }




  goBack(): void {
    this.router.navigate(['/user-list']);
  }

}
