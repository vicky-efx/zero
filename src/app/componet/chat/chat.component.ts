import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { VideosignalingService } from '../../services/videosignaling.service';
import { AudiosignalingService } from '../../services/audiosignaling.service';
import { Location } from '@angular/common'; 

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
  chatId = '';
  userStatusText: string = '';
  statusColor = '';
  pressTimer: any;
  pressDuration = 800;
  showUnsendModal = false;
  messageToUnsend: any = null;
  groupedMessages: { date: string, messages: any[] }[] = [];
  groupedMessageKeys: string[] = [];
  replyToMessage: any = null;
  touchStartX: number = 0;
  touchEndX: number = 0;
  mouseStartX: number = 0;
  mouseSwiped: boolean = false;
  peer!: RTCPeerConnection;
  remoteStream = new MediaStream();
  localStream!: MediaStream;
  private subscriptions: Subscription[] = [];
  roomId: string = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private userService: UserService,
    private videoSignal: VideosignalingService,
    private audioSignal: AudiosignalingService,
    private location: Location
  ) { }

  @ViewChild('messageList') messageList!: ElementRef;

  ngOnInit(): void {
    this.currentUserId = sessionStorage.getItem('userId') || '';
    this.selectedUserId = this.route.snapshot.paramMap.get('id') || '';
    this.chatId = this.chatService.generateChatId(this.currentUserId, this.selectedUserId);

    this.messages = []; // Initialize before loading messages

    this.userService.getUserById(this.selectedUserId).subscribe(user => {
      if (user) {
        this.userName = user.name || 'Unknown';

        if (user.status === 'online') {
          this.userStatusText = 'online';
          this.statusColor = '#138f53';
        } else {
          this.userStatusText = this.formatLastSeen(user.lastSeen);
          this.statusColor = 'black';
        }
      } else {
        this.userName = 'Unknown';
        this.userStatusText = 'offline';
        this.statusColor = 'black';
      }
    });

    this.loadMessages();
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
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.peer) this.peer.close();
    if (this.localStream) this.localStream.getTracks().forEach(track => track.stop());
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

    // Optional: Detect if it's a video call message
    const isMeetInvite = trimmed.startsWith('📹 Join my video call');

    const messagePayload = {
      from: this.currentUserId,
      to: this.selectedUserId,
      content: trimmed,
      timestamp: new Date(),
      type: isMeetInvite ? 'video' : 'text',  // Optional: for message type handling
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

  goBack() {
    this.location.back(); // ✅ Now it works
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

  startPress(message: any) {
    if (message.from !== this.currentUserId || message.unsent) return;

    this.pressTimer = setTimeout(() => {
      this.messageToUnsend = message;
      this.showUnsendModal = true;
    }, 600);
  }

  cancelPress() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  unsendConfirmed() {
    if (this.messageToUnsend) {
      this.messageToUnsend.unsent = true;
      this.showUnsendModal = false;

      const fromId = this.messageToUnsend.from;
      const toId = this.messageToUnsend.to;
      const chatId = this.chatService.generateChatId(fromId, toId);

      this.chatService.unsendMessage(chatId, this.messageToUnsend)
        .then(() => console.log('Message unsent in Firestore'))
        .catch((err) => console.error('Failed to unsend message:', err));
    }
  }

  closeUnsendModal() {
    this.showUnsendModal = false;
  }

  onMouseDown(event: MouseEvent, msg: any) {
    this.mouseStartX = event.clientX;
    this.mouseSwiped = false;
  }

  onMouseMove(event: MouseEvent, msg: any) {
    if (this.mouseStartX === 0) return;

    const currentX = event.clientX;
    const diff = currentX - this.mouseStartX;

    if (Math.abs(diff) > 80 && !this.mouseSwiped) {
      this.mouseSwiped = true;

      if (diff > 0 && msg.from !== this.currentUserId) {
        this.setReplyTo(msg); // swipe right to reply for "them"
      }

      if (diff < 0 && msg.from === this.currentUserId) {
        this.setReplyTo(msg); // swipe left to reply for "me"
      }

      const target = (event.target as HTMLElement).closest('.message');
      if (target) {
        target.classList.add('swipe-reply');
        setTimeout(() => target.classList.remove('swipe-reply'), 600);
      }
    }
  }

  onMouseUp(msg: any) {
    this.mouseStartX = 0;
  }

  cancelSwipe() {
    this.mouseStartX = 0;
  }

  setReplyTo(msg: any) {
    this.replyToMessage = msg;
  }

  cancelReply() {
    this.replyToMessage = null;
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchMove(event: TouchEvent, msg: any) {
    this.touchEndX = event.changedTouches[0].screenX;
    const diff = this.touchEndX - this.touchStartX;

    if (Math.abs(diff) > 80) {
      if (diff > 0 && msg.from !== this.currentUserId) {
        this.setReplyTo(msg);
      }

      if (diff < 0 && msg.from === this.currentUserId) {
        this.setReplyTo(msg);
      }

      const target = (event.target as HTMLElement).closest('.message');
      if (target) {
        target.classList.add('swipe-reply');
        setTimeout(() => target.classList.remove('swipe-reply'), 600);
      }

      this.touchStartX = 0;
      this.touchEndX = 0;
    }
  }

  onTouchEnd(msg: any) {
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  async sendMeetInvite() {
    await this.setupPeerConnection('video');
    const roomId = await this.videoSignal.createVideoRoom(this.peer);
    const meetLink = `/video-call/${roomId}`;
    this.newMessage = `📹 Join my video call: ${meetLink}`;
    await this.sendMessage();
    this.router.navigateByUrl(meetLink);
  }

  async sendAudioCallInvite() {
    await this.setupPeerConnection('audio');
    const roomId = await this.audioSignal.createAudioRoom(this.peer);
    const meetLink = `/audio-call/${roomId}`;
    this.newMessage = `📞 Join my audio call: ${meetLink}`;
    await this.sendMessage();
    this.router.navigateByUrl(meetLink);
  }

  async joinVideoCall(link: string) {
    const roomId = link.split('/video-call/')[1];
    await this.setupPeerConnection('video');
    await this.videoSignal.joinVideoRoom(roomId, this.peer);
    this.router.navigateByUrl(`/video-call/${roomId}`);
  }

  async joinAudioCall(link: string) {
    const roomId = link.split('/audio-call/')[1];
    await this.setupPeerConnection('audio');
    await this.audioSignal.joinAudioRoom(roomId, this.peer);
    this.router.navigateByUrl(`/audio-call/${roomId}`);
  }

  private async setupPeerConnection(type: 'audio' | 'video') {
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    this.peer = new RTCPeerConnection(config);

    if (type === 'video') {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } else {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    this.localStream.getTracks().forEach(track => {
      this.peer.addTrack(track, this.localStream);
    });

    this.peer.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };

    this.peer.onicecandidate = async (event) => {
      if (event.candidate && this.roomId) {
        const role = this.peer.remoteDescription ? 'callee' : 'caller';
        const signalingService = type === 'video' ? this.videoSignal : this.audioSignal;
        await signalingService.addIceCandidate(this.roomId, role, event.candidate.toJSON());
      }
    };
  }

}
