import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, collectionData, writeBatch, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { from, map, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private firestore: Firestore) { }

  generateChatId(userA: string, userB: string): string {
    return userA < userB ? `${userA}_${userB}` : `${userB}_${userA}`;
  }

  sendMessage(fromId: string, toId: string, content?: string | any, image?: string): Promise<any> {
    const blockedRef = collection(this.firestore, 'blockedUsers');
    const blockQuery = query(blockedRef, where('blockedUserId', '==', fromId), where('userId', '==', toId));

    return getDocs(blockQuery).then(snapshot => {
      if (!snapshot.empty) {
        return Promise.reject('You are blocked by this user.');
      }

      const chatId = this.generateChatId(fromId, toId);
      const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);

      let msgData: any = {
        from: fromId,
        to: toId,
        timestamp: serverTimestamp(),
        read: false,
      };

      if (typeof content === 'string') {
        msgData.content = content;
      } else if (typeof content === 'object') {
        msgData = { ...msgData, ...content };
      }

      if (image) msgData.image = image;

      return addDoc(messagesRef, msgData);
    });
  }


  getMessages(fromId: string, toId: string): Observable<any[]> {
    const chatId = this.generateChatId(fromId, toId);

    const clearedRef = collection(this.firestore, 'clearedChats');
    const clearedQuery = query(clearedRef, where('userId', '==', fromId), where('chatId', '==', chatId));

    return from(getDocs(clearedQuery)).pipe(
      switchMap(snapshot => {
        if (!snapshot.empty) {
          // Chat was cleared → return empty
          return of([]);
        }

        const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        return collectionData(q, { idField: 'id' });
      })
    );
  }

  clearChat(userId: string, chatId: string): Promise<void> {
    const clearedRef = collection(this.firestore, 'clearedChats');
    return addDoc(clearedRef, {
      userId,
      chatId,
      timestamp: new Date(),
    }).then(() => { });
  }

  restoreChat(userId: string, chatId: string): Promise<void> {
    const clearedRef = collection(this.firestore, 'clearedChats');
    const q = query(clearedRef, where('userId', '==', userId), where('chatId', '==', chatId));

    return getDocs(q).then(snapshot => {
      const batch = writeBatch(this.firestore);
      snapshot.forEach(docSnap => {
        batch.delete(doc(this.firestore, 'clearedChats', docSnap.id));
      });
      return batch.commit();
    });
  }

  isChatCleared(userId: string, chatId: string): Promise<boolean> {
    const clearedRef = collection(this.firestore, 'clearedChats');
    const q = query(clearedRef, where('userId', '==', userId), where('chatId', '==', chatId));

    return getDocs(q).then(snapshot => !snapshot.empty);
  }

  blockUser(currentUserId: string, otherUserId: string): Promise<void> {
    const blockedRef = collection(this.firestore, 'blockedUsers');
    return addDoc(blockedRef, {
      userId: currentUserId,
      blockedUserId: otherUserId,
      timestamp: new Date(),
    }).then(() => { });
  }

  unblockUser(currentUserId: string, otherUserId: string): Promise<void> {
    const blockedRef = collection(this.firestore, 'blockedUsers');
    const q = query(blockedRef, where('userId', '==', currentUserId), where('blockedUserId', '==', otherUserId));

    return getDocs(q).then(snapshot => {
      const batch = writeBatch(this.firestore);
      snapshot.forEach(docSnap => {
        batch.delete(doc(this.firestore, 'blockedUsers', docSnap.id));
      });
      return batch.commit();
    });
  }

  isUserBlocked(currentUserId: string, otherUserId: string): Promise<boolean> {
    const blockedRef = collection(this.firestore, 'blockedUsers');
    const q = query(blockedRef, where('userId', '==', currentUserId), where('blockedUserId', '==', otherUserId));

    return getDocs(q).then(snapshot => !snapshot.empty);
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    const chatId = this.generateChatId(senderId, receiverId);
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);

    const unreadQuery = query(
      messagesRef,
      where('to', '==', receiverId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(unreadQuery);

    const updatePromises = snapshot.docs.map(docSnap =>
      updateDoc(docSnap.ref, { read: true })
    );

    await Promise.all(updatePromises);
  }

  unsendMessage(chatId: string, message: any): Promise<void> {
    const messageRef = doc(this.firestore, `chats/${chatId}/messages/${message.id}`);
    return updateDoc(messageRef, {
      content: '🚫 Message unsent',
      unsent: true
    });
  }



}
