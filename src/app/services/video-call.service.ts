import { Injectable } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class VideoCallService {
  public localStream!: MediaStream;
  public remoteStream!: MediaStream;
  private peerConnection!: RTCPeerConnection;
  private roomId!: string;
  private roomRef: any;

  constructor(private firestore: Firestore) { }

  async init(roomId: string) {
    this.roomId = roomId;
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.remoteStream = new MediaStream();

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => this.remoteStream.addTrack(track));
    };

    const roomDoc = doc(this.firestore, 'video-rooms', this.roomId);
    const roomSnapshot = await getDoc(roomDoc);

    if (roomSnapshot.exists()) {
      await this.joinRoom(roomDoc);
    } else {
      await this.createRoom(roomDoc);
    }
  }

  private async createRoom(roomDoc: any) {
    this.roomRef = roomDoc;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    await setDoc(roomDoc, { offer });

    onSnapshot(roomDoc, async (snapshot: any) => {
      const data = snapshot.data();
      if (data?.answer && !this.peerConnection.currentRemoteDescription) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    this.listenForICE(roomDoc, 'callerCandidates');
  }

  private async joinRoom(roomDoc: any) {
    this.roomRef = roomDoc;
    const roomData = (await getDoc(roomDoc)).data() as { offer?: RTCSessionDescriptionInit };
    if (!roomData?.offer) return;

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(roomData.offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    await updateDoc(roomDoc, { answer });

    this.listenForICE(roomDoc, 'calleeCandidates');
  }

  private listenForICE(roomDoc: any, collectionName: string) {
    const candidatesCollection = collection(this.firestore, `video-rooms/${this.roomId}/${collectionName}`);

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await setDoc(doc(candidatesCollection), event.candidate.toJSON());
      }
    };

    onSnapshot(candidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  leaveRoom() {
    if (this.peerConnection) this.peerConnection.close();
    if (this.localStream) this.localStream.getTracks().forEach(t => t.stop());
    if (this.roomRef) deleteDoc(this.roomRef);
  }
}
