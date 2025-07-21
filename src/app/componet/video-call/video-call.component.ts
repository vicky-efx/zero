import {  Component,   OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SignalingService } from '../../services/signaling.service';
@Component({
  selector: 'app-video-call',
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.scss'
})
export class VideoCallComponent implements OnInit  {
  roomId!: string;
  localVideo!: HTMLVideoElement;
  remoteVideo!: HTMLVideoElement;

  constructor(private route: ActivatedRoute, private signalingService: SignalingService) { }

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId')!;
    this.localVideo = document.getElementById('localVideo') as HTMLVideoElement;
    this.remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;

    if (location.pathname.includes('join')) {
      this.joinCall();
    } else {
      this.startCall();
    }
  }

  async startCall() {
    const { localStream, remoteStream } = await this.signalingService.createRoom(this.roomId);
    this.localVideo.srcObject = localStream;
    this.remoteVideo.srcObject = remoteStream;
  }

  async joinCall() {
    const { localStream, remoteStream } = await this.signalingService.joinRoom(this.roomId);
    this.localVideo.srcObject = localStream;
    this.remoteVideo.srcObject = remoteStream;
  }

}
