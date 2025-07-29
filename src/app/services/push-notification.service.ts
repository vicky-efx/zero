import { Injectable } from '@angular/core';
import { getMessaging, getToken } from 'firebase/messaging';
import { environment } from '../../environment/environments';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore'; 

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private messaging = getMessaging();
  
  constructor(private firestore: Firestore) { }

  requestPermission(userId: string): void {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        getToken(this.messaging, {
          vapidKey: environment.vapidKey
        }).then((token) => {
          if (token) {
            this.saveTokenIfChanged(userId, token);
          }
        });
      }
    });
  }

  private async saveTokenIfChanged(userId: string, token: string) {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userSnap = await getDoc(userRef);
    const existingToken = userSnap.data()?.['fcmToken'];

    if (existingToken !== token) {
      await setDoc(userRef, { fcmToken: token }, { merge: true });
      console.log('✅ FCM Token saved/updated.');
    } else {
      console.log('ℹ️ FCM Token unchanged.');
    }
  }
}
