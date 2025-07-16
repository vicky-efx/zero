import { Injectable } from '@angular/core';
import { Firestore, doc, docData, collection, collectionData, addDoc, query, where, getDocs, updateDoc, orderBy, limit } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, map, switchMap, throwError } from 'rxjs';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userDataSubject = new BehaviorSubject<any>(null);
  userData$ = this.userDataSubject.asObservable();

  constructor(private firestore: Firestore, private chatService: ChatService) { }

  SignUp(userData: any): Observable<any> {
    const usersCollection = collection(this.firestore, 'users');

    const emailQuery = query(usersCollection, where('email', '==', userData.email));
    const phoneQuery = query(usersCollection, where('phoneNumber', '==', userData.phoneNumber));

    const emailCheck$ = from(getDocs(emailQuery)).pipe(
      switchMap(emailSnapshot => {
        if (!emailSnapshot.empty) {
          return throwError(() => new Error('Email already exists'));
        }

        return from(getDocs(phoneQuery)).pipe(
          switchMap(phoneSnapshot => {
            if (!phoneSnapshot.empty) {
              return throwError(() => new Error('Phone number already exists'));
            }

            return from(addDoc(usersCollection, userData));
          })
        );
      })
    );

    return emailCheck$;
  }

  loginUser(email: string, password: string): Promise<any> {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(usersCollection, where('email', '==', email), where('password', '==', password));

    return getDocs(q).then(snapshot => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        userData['id'] = snapshot.docs[0].id;
        return userData;
      } else {
        throw new Error('Invalid email or password');
      }
    });
  }

  getAllUsersExcludeCurrent(userId: string): Observable<any[]> {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }).pipe(
      map(users =>
        users
          .filter(user => user.id !== userId)
          .map(user => ({
            ...user,
            statusText: user['status'] === 'online' ? 'online' : this.formatLastSeen(user['lastSeen'])
          }))
      )
    );
  }



  getUserById(id: string): Observable<any> {
    const userDoc = doc(this.firestore, `users/${id}`);
    return docData(userDoc, { idField: 'id' });
  }

  setUserData(data: any) {
    this.userDataSubject.next(data);
  }

  updateUserImage(id: string, imageUrl: string) {
    const userDoc = doc(this.firestore, `users/${id}`);
    return updateDoc(userDoc, { image: imageUrl });
  }

  updateUserStatus(userId: string, status: 'online' | 'offline') {
    const userDoc = doc(this.firestore, `users/${userId}`);
    const updateData: any = { status };

    if (status === 'offline') {
      updateData.lastSeen = Date.now();
    }

    return updateDoc(userDoc, updateData);
  }

  private formatLastSeen(lastSeen: number | undefined): string {
    if (!lastSeen) {
      return 'Offline';
    }

    const lastDate = new Date(lastSeen);
    const now = new Date();

    const diffMs = now.getTime() - lastDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return 'last seen just now';
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const lastSeenDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

    let timeString = lastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (lastSeenDay.getTime() === today.getTime()) {
      return `last seen today at ${timeString}`;
    } else if (lastSeenDay.getTime() === yesterday.getTime()) {
      return `last seen yesterday at ${timeString}`;
    } else {
      const dateString = lastDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
      return `last seen on ${dateString} at ${timeString}`;
    }
  }

  getLastMessageInfo(currentUserId: string, otherUserId: string): Promise<{ lastMessage: string, lastTime: string, unreadCount: number }> {
    const chatId = this.chatService.generateChatId(currentUserId, otherUserId);
    const messagesCollection = collection(this.firestore, `chats/${chatId}/messages`);

    const lastMsgQuery = query(messagesCollection, orderBy('timestamp', 'desc'), limit(1));

    return getDocs(lastMsgQuery).then(snapshot => {
      let lastMessage = '';
      let lastTime = '';
      let unreadCount = 0;

      if (!snapshot.empty) {
        const msgData = snapshot.docs[0].data();
        lastMessage = msgData['content'] || 'Image';

        const rawTimestamp = msgData['timestamp'];
        let date: Date;

        if (rawTimestamp && typeof rawTimestamp.toDate === 'function') {
          // Firestore Timestamp object
          date = rawTimestamp.toDate();
        } else if (typeof rawTimestamp === 'string') {
          // fallback in case stored as string
          date = new Date(rawTimestamp);
        } else {
          // fallback to now
          date = new Date();
        }

        lastTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


      }

      const unreadQuery = query(
        messagesCollection,
        where('to', '==', currentUserId),
        where('read', '==', false)
      );

      return getDocs(unreadQuery).then(unreadSnapshot => {
        unreadCount = unreadSnapshot.size;
        return { lastMessage, lastTime, unreadCount };
      });
    });
  }

}
