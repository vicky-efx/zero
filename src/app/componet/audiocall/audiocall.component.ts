import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { addDoc, collection, doc } from 'firebase/firestore';
import { CommonModule } from '@angular/common';
import { AudiosignalingService } from '../../services/audiosignaling.service';

@Component({
  selector: 'app-audiocall',
  imports: [CommonModule],
  templateUrl: './audiocall.component.html',
  styleUrl: './audiocall.component.scss'
})
export class AudiocallComponent implements OnInit, OnDestroy {
  localStream!: MediaStream;
  remoteStream = new MediaStream();
  peer!: RTCPeerConnection;
  roomId!: string;
  callDuration: number = 0;
  callTimer!: any;
  micEnabled: boolean = true;
  callStatus = '🔗 Connecting...';
  isCaller = false;

  @ViewChild('localAudio', { static: true }) localAudioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('remoteAudio', { static: true }) remoteAudioRef!: ElementRef<HTMLAudioElement>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private signaling: AudiosignalingService
  ) { }

  ngAfterViewInit() {
    if (this.localStream) {
      this.localAudioRef.nativeElement.srcObject = this.localStream;
    }

    if (this.remoteStream) {
      this.remoteAudioRef.nativeElement.srcObject = this.remoteStream;
    }
  }

  async ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    this.isCaller = !this.roomId;

    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    this.peer = new RTCPeerConnection(config);

    // Setup media
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.localAudioRef.nativeElement.srcObject = this.localStream;
    this.localStream.getTracks().forEach(track => this.peer.addTrack(track, this.localStream));

    this.peer.ontrack = (event) => {
      event.streams[0].getTracks().forEach(t => this.remoteStream.addTrack(t));
      this.remoteAudioRef.nativeElement.srcObject = this.remoteStream;
    };

    // ICE candidates
    this.peer.onicecandidate = async (event) => {
      if (event.candidate) {
        const role = this.isCaller ? 'caller' : 'callee';
        await this.signaling.addIceCandidate(this.roomId, role, event.candidate.toJSON());
      }
    };

    // Signaling setup
    if (this.isCaller) {
      this.roomId = await this.signaling.createAudioRoom(this.peer);
    } else {
      await this.signaling.joinAudioRoom(this.roomId, this.peer);
    }

    // Call connection state
    this.peer.onconnectionstatechange = () => {
      if (this.peer.connectionState === 'connected') {
        this.callStatus = '✅ Connected';
      } else if (this.peer.connectionState === 'disconnected' || this.peer.connectionState === 'failed') {
        this.callStatus = '❌ Disconnected';
      }
    };

    // Start timer
    this.callTimer = setInterval(() => this.callDuration++, 1000);
  }

  toggleMic() {
    this.micEnabled = !this.micEnabled;
    this.localStream.getAudioTracks().forEach(track => track.enabled = this.micEnabled);
  }

  hangUp() {
    if (this.peer) this.peer.close();
    if (this.localStream) this.localStream.getTracks().forEach(track => track.stop());
    clearInterval(this.callTimer);
    this.callStatus = '📴 Call Ended';
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.peer) this.peer.close();
    if (this.localStream) this.localStream.getTracks().forEach(t => t.stop());
    clearInterval(this.callTimer);
  }
}