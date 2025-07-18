import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { VideoCallService } from '../../services/video-call.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Firestore, onSnapshot } from 'firebase/firestore';

@Component({
  selector: 'app-video-call',
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.scss'
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  roomId: string = '';
  currentUserId: string = '';
  remoteUserId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) { }
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    // Get room ID from route
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';

    // Parse current user ID from roomId (e.g., "12_abcdxy")
    const [userId] = this.roomId.split('_');
    this.currentUserId = userId;
  }

  ngAfterViewInit(): void {
    // Now you can use localVideo.nativeElement safely
    console.log('Video call started by user:', this.currentUserId);
    console.log('Room ID:', this.roomId);

    // Connect to Firebase/WebRTC here
  }

  leaveRoom() {
    // Leave room logic
    this.router.navigate(['/chat', this.remoteUserId || this.currentUserId]);
  }
}
