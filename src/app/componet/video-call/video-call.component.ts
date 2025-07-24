import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalingService } from '../../services/signaling.service';
import { doc, getDoc } from 'firebase/firestore';
@Component({
  selector: 'app-video-call',
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.scss'
})
export class VideoCallComponent implements OnInit {
  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;

  roomId: string;

  constructor(private route: ActivatedRoute, public signaling: SignalingService) {
    this.roomId = this.route.snapshot.paramMap.get('roomId')!;
  }

  async ngOnInit() {
    const docRef = doc(this.signaling.firestore, `rooms/${this.roomId}`);
    const docSnap = await getDoc(docRef);

    const isCaller = !docSnap.exists();

    const { localStream, remoteStream } = isCaller
      ? await this.signaling.createRoom(this.roomId)
      : await this.signaling.joinRoom(this.roomId);

    this.localVideo.nativeElement.srcObject = localStream;
    this.remoteVideo.nativeElement.srcObject = remoteStream;
  }


  hangUp() {
    this.signaling.peerConnection.close();
    window.location.href = '/';
  }
}
