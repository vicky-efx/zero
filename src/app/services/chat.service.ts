import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, collectionData } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Message } from '../models/message.model';

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
}
