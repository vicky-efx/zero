import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, onSnapshot, deleteDoc, updateDoc, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  peerConnection!: RTCPeerConnection;
  localStream!: MediaStream;
  remoteStream!: MediaStream;

  constructor(private firestore: Firestore) { }

  async createRoom(roomId: string): Promise<{ localStream: MediaStream; remoteStream: MediaStream }> {
    const roomRef = doc(this.firestore, 'rooms', roomId);

    this.peerConnection = new RTCPeerConnection();
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.remoteStream = new MediaStream();

    // Add local tracks
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    // Get remote tracks
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };

    // ICE candidate
    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await updateDoc(roomRef, {
          callerCandidates: event.candidate.toJSON()
        });
      }
    };

    // Offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    await setDoc(roomRef, {
      offer: {
        type: offer.type,
        sdp: offer.sdp
      }
    });

    return { localStream: this.localStream, remoteStream: this.remoteStream };
  }

  async joinRoom(roomId: string): Promise<{ localStream: MediaStream; remoteStream: MediaStream }> {
    const roomRef = doc(this.firestore, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');

    const roomData = roomSnap.data() as any;

    this.peerConnection = new RTCPeerConnection();
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.remoteStream = new MediaStream();

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await updateDoc(roomRef, {
          answerCandidates: event.candidate.toJSON()
        });
      }
    };

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(roomData.offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await updateDoc(roomRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      }
    });

    return { localStream: this.localStream, remoteStream: this.remoteStream };
  }
}
