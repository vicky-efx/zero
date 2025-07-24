import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  roomId!: string;
  localStream!: MediaStream;
  remoteStream!: MediaStream;
  peerConnection!: RTCPeerConnection;

  private servers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  constructor(public firestore: Firestore) { }

  async createRoom(roomId: string) {
    this.roomId = roomId;
    this.peerConnection = new RTCPeerConnection(this.servers);
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.remoteStream = new MediaStream();

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = event => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };

    const roomRef = doc(this.firestore, 'rooms', roomId);
    const callerCandidatesCollection = collection(this.firestore, `rooms/${roomId}/callerCandidates`);

    this.peerConnection.onicecandidate = async event => {
      if (event.candidate) {
        await addDoc(callerCandidatesCollection, event.candidate.toJSON());
      }
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    await setDoc(roomRef, { offer });

    onSnapshot(roomRef, async snapshot => {
      const data = snapshot.data();
      if (data && data['answer'] && !this.peerConnection.currentRemoteDescription) {
        const answerDesc = new RTCSessionDescription(data['answer']);
        await this.peerConnection.setRemoteDescription(answerDesc);
      }
    });

    const calleeCandidatesCollection = collection(this.firestore, `rooms/${roomId}/calleeCandidates`);
    onSnapshot(calleeCandidatesCollection, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          this.peerConnection.addIceCandidate(candidate);
        }
      });
    });

    return { localStream: this.localStream, remoteStream: this.remoteStream };
  }

  async joinRoom(roomId: string) {
    this.roomId = roomId;
    this.peerConnection = new RTCPeerConnection(this.servers);
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.remoteStream = new MediaStream();

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = event => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };

    const calleeCandidatesCollection = collection(this.firestore, `rooms/${roomId}/calleeCandidates`);
    this.peerConnection.onicecandidate = async event => {
      if (event.candidate) {
        await addDoc(calleeCandidatesCollection, event.candidate.toJSON());
      }
    };

    const roomRef = doc(this.firestore, 'rooms', roomId);
    const roomSnapshot = await getDoc(roomRef);
    const roomData = roomSnapshot.data();

    if (roomData?.['offer']) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(roomData['offer']));

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await updateDoc(roomRef, { answer });
    }

    const callerCandidatesCollection = collection(this.firestore, `rooms/${roomId}/callerCandidates`);
    onSnapshot(callerCandidatesCollection, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          this.peerConnection.addIceCandidate(candidate);
        }
      });
    });

    return { localStream: this.localStream, remoteStream: this.remoteStream };
  }

  async hangUp() {
    this.peerConnection?.close();
    this.localStream?.getTracks().forEach(track => track.stop());
    this.remoteStream?.getTracks().forEach(track => track.stop());

    if (this.roomId) {
      const roomRef = doc(this.firestore, 'rooms', this.roomId);
      await deleteDoc(roomRef);
    }
  }
}
