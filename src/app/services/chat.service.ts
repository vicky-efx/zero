import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, collectionData, writeBatch } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private firestore: Firestore) { }

  generateChatId(userA: string, userB: string): string {
    return userA < userB ? `${userA}_${userB}` : `${userB}_${userA}`;
  }

  sendMessage(fromId: string, toId: string, content?: string, image?: string): Promise<any> {
    const chatId = this.generateChatId(fromId, toId);
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);

    const msgData: any = {
      from: fromId,
      to: toId,
      timestamp: serverTimestamp(),
    };

    if (content) {
      msgData.content = content;
    }

    if (image) {
      msgData.image = image;
    }

    return addDoc(messagesRef, msgData);
  }


  getMessages(fromId: string, toId: string): Observable<any[]> {
    const chatId = this.generateChatId(fromId, toId);
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return collectionData(q, { idField: 'id' }); // live updates automatically
  }

  // In ChatService

  deleteChat(fromId: string, toId: string): Promise<void> {
    const chatId = this.generateChatId(fromId, toId);
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);

    return getDocs(messagesRef).then(snapshot => {
      const batch = writeBatch(this.firestore); // ✅ FIX: use writeBatch function

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      return batch.commit();
    });
  }

  blockUser(currentUserId: string, otherUserId: string): Promise<void> {
    const blockedRef = collection(this.firestore, 'blockedUsers');
    return addDoc(blockedRef, {
      userId: currentUserId,
      blockedUserId: otherUserId,
      timestamp: new Date(),
    }).then(() => { });
  }

}
