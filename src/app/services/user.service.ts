import { Injectable } from '@angular/core';
import { Firestore, doc, docData, collection, collectionData, addDoc, query, where, getDocs, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, map, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userDataSubject = new BehaviorSubject<any>(null);
  userData$ = this.userDataSubject.asObservable();

  constructor(private firestore: Firestore) { }

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
      map(users => users.filter(user => user.id !== userId))
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

}
