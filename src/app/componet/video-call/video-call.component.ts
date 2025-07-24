import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalingService } from '../../services/signaling.service';
@Component({
  selector: 'app-video-call',
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.scss'
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  roomId: string = '';
  localStream!: MediaStream;
  remoteStream!: MediaStream;
  isMuted = false;

  constructor(private route: ActivatedRoute, private signalingService: SignalingService) { }

  async ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';

    try {
      const { localStream, remoteStream } = await this.signalingService.joinRoom(this.roomId);
      this.localStream = localStream;
      this.remoteStream = remoteStream;
      this.localVideoRef.nativeElement.srcObject = localStream;
      this.remoteVideoRef.nativeElement.srcObject = remoteStream;
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }

  toggleMute() {
    if (this.localStream) {
      this.isMuted = !this.isMuted;
      this.localStream.getAudioTracks().forEach(track => (track.enabled = !this.isMuted));
    }
  }

  leaveRoom() {
    
    if (this.localStream) this.localStream.getTracks().forEach(track => track.stop());
    if (this.remoteStream) this.remoteStream.getTracks().forEach(track => track.stop());
    window.close(); // or this.router.navigate(['/chat']);
  }

  ngOnDestroy() {
    this.leaveRoom();
  }
}
