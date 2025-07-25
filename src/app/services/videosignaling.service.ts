import { Injectable } from '@angular/core';
import {
  getFirestore,
  setDoc,
  getDoc,
  updateDoc,
  doc,
  collection,
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { environment } from '../../environment/environments';

@Injectable({ providedIn: 'root' })
export class VideosignalingService {
  firestore = getFirestore(initializeApp(environment.firebase));

  async createVideoRoom(peer: RTCPeerConnection): Promise<string> {
    const roomId = `video-room-${Date.now()}`;
    const roomRef = doc(this.firestore, 'videoRooms', roomId);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await setDoc(roomRef, { offer });

    return roomId;
  }

  async joinVideoRoom(roomId: string, peer: RTCPeerConnection): Promise<void> {
    const roomRef = doc(this.firestore, 'videoRooms', roomId);
    const roomSnap = await getDoc(roomRef);
    const data = roomSnap.data();

    if (data?.['offer']) {
      await peer.setRemoteDescription(data['offer']);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await updateDoc(roomRef, { answer });
    }

    onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (data?.['answer'] && !peer.remoteDescription) {
        await peer.setRemoteDescription(data['answer']);
      }
    });
  }

  async addIceCandidate(roomId: string, role: 'caller' | 'callee', candidate: RTCIceCandidateInit) {
    const roomRef = doc(this.firestore, 'videoRooms', roomId);
    await addDoc(collection(roomRef, `${role}Candidates`), candidate);
  }
}
