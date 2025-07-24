import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, onSnapshot, updateDoc, collection } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  peerConnection!: RTCPeerConnection;
  localStream!: MediaStream;
  remoteStream!: MediaStream;
  roomId!: string;


  constructor(public firestore: Firestore) { }

  async initPeer() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      this.remoteStream.addTrack(event.track);
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidatesCollection = collection(this.firestore, `rooms/${this.roomId}/callerCandidates`);
        await setDoc(doc(candidatesCollection), event.candidate.toJSON());
      }
    };
  }

  async createRoom(roomId: string): Promise<{ localStream: MediaStream; remoteStream: MediaStream }> {
    this.roomId = roomId;

    await this.initPeer();

    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const roomRef = doc(this.firestore, `rooms/${roomId}`);
    await setDoc(roomRef, { offer });

    onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (data?.['answer'] && !this.peerConnection.currentRemoteDescription) {
        const answerDesc = new RTCSessionDescription(data['answer']);
        await this.peerConnection.setRemoteDescription(answerDesc);
      }
    });

    return { localStream: this.localStream, remoteStream: this.remoteStream };
  }

  async joinRoom(roomId: string): Promise<{ localStream: MediaStream; remoteStream: MediaStream }> {
    this.roomId = roomId;

    const roomRef = doc(this.firestore, `rooms/${roomId}`);
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data();

    await this.initPeer();

    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));

    const offerDesc = new RTCSessionDescription(roomData?.['offer']);
    await this.peerConnection.setRemoteDescription(offerDesc);

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await updateDoc(roomRef, { answer });

    return { localStream: this.localStream, remoteStream: this.remoteStream };
  }
}
