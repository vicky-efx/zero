// services/signaling.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  private peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream;
  private remoteStream!: MediaStream;

  constructor(private firestore: Firestore) { }

async createRoom(roomId: string) {
  this.peerConnection = new RTCPeerConnection();
  this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));
  this.remoteStream = new MediaStream();
  this.peerConnection.ontrack = event => {
    event.streams[0].getTracks().forEach(track => this.remoteStream.addTrack(track));
  };

  // ICE candidates
  const callerCandidatesCollection = collection(this.firestore, `video-rooms/${roomId}/callerCandidates`);
  this.peerConnection.onicecandidate = event => {
    if (event.candidate) {
      setDoc(doc(callerCandidatesCollection), event.candidate.toJSON());
    }
  };

  const offer = await this.peerConnection.createOffer();
  await this.peerConnection.setLocalDescription(offer);

  const roomRef = doc(this.firestore, 'video-rooms', roomId);
  await setDoc(roomRef, { offer });

  // Listen for answer
  onSnapshot(roomRef, async (snapshot) => {
    const data = snapshot.data();
    if (data?.['answer'] && !this.peerConnection.currentRemoteDescription) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data['answer']));
    }
  });

  // Listen for callee ICE candidates
  const calleeCandidatesCollection = collection(this.firestore, `video-rooms/${roomId}/calleeCandidates`);
  onSnapshot(calleeCandidatesCollection, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  return { roomId, localStream: this.localStream, remoteStream: this.remoteStream };
}


async joinRoom(roomId: string) {
  this.peerConnection = new RTCPeerConnection();
  this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));
  this.remoteStream = new MediaStream();
  this.peerConnection.ontrack = event => {
    event.streams[0].getTracks().forEach(track => this.remoteStream.addTrack(track));
  };

  const roomRef = doc(this.firestore, 'video-rooms', roomId);
  const roomSnapshot = await getDoc(roomRef);
  const offer = roomSnapshot.data()?.['offer'];
  await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await this.peerConnection.createAnswer();
  await this.peerConnection.setLocalDescription(answer);
  await updateDoc(roomRef, { answer });

  // Add callee ICE candidates
  const calleeCandidatesCollection = collection(this.firestore, `video-rooms/${roomId}/calleeCandidates`);
  this.peerConnection.onicecandidate = event => {
    if (event.candidate) {
      setDoc(doc(calleeCandidatesCollection), event.candidate.toJSON());
    }
  };

  // Listen for caller ICE candidates
  const callerCandidatesCollection = collection(this.firestore, `video-rooms/${roomId}/callerCandidates`);
  onSnapshot(callerCandidatesCollection, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  return { localStream: this.localStream, remoteStream: this.remoteStream };
}

}
