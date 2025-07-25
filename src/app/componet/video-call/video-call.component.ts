import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { doc, getDoc } from 'firebase/firestore';
import { VideosignalingService } from '../../services/videosignaling.service';
@Component({
  selector: 'app-video-call',
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.scss'
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  peer!: RTCPeerConnection;
  localStream!: MediaStream;
  remoteStream = new MediaStream();
  roomId!: string;
  isCaller = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private signaling: VideosignalingService
  ) { }

  async ngOnInit(): Promise<void> {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    this.isCaller = this.roomId.startsWith('video-room');

    await this.setupWebRTC();
    await this.connectToRoom();
  }

  async setupWebRTC() {
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    this.peer = new RTCPeerConnection(config);

    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream.getTracks().forEach(track => {
      this.peer.addTrack(track, this.localStream);
    });

    this.peer.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
      if (this.remoteVideoRef?.nativeElement) {
        this.remoteVideoRef.nativeElement.srcObject = this.remoteStream;
      }
    };

    this.peer.onicecandidate = async (event) => {
      if (event.candidate) {
        const role = this.isCaller ? 'caller' : 'callee';
        await this.signaling.addIceCandidate(this.roomId, role, event.candidate.toJSON());
      }
    };

    if (this.localVideoRef?.nativeElement) {
      this.localVideoRef.nativeElement.srcObject = this.localStream;
    }
  }

  async connectToRoom() {
    if (this.isCaller) {
      await this.signaling.createVideoRoom(this.peer).then((id) => {
        this.roomId = id;
      });
    } else {
      await this.signaling.joinVideoRoom(this.roomId, this.peer);
    }
  }

  hangUp() {
    if (this.peer) this.peer.close();
    if (this.localStream) this.localStream.getTracks().forEach(t => t.stop());
    this.router.navigate(['/chat']); // Go back to chat page or homepage
  }

  ngOnDestroy(): void {
    if (this.peer) this.peer.close();
    if (this.localStream) this.localStream.getTracks().forEach(track => track.stop());
  }
}
