import { Routes } from '@angular/router';
import { LoginComponent } from './componet/login/login.component';
import { SignUpComponent } from './componet/sign-up/sign-up.component';
import { UserListComponent } from './componet/user-list/user-list.component';
import { ProfileComponent } from './componet/profile/profile.component';
import { ChatComponent } from './componet/chat/chat.component';
import { VideoCallComponent } from './componet/video-call/video-call.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignUpComponent },
    { path: 'user-list', component: UserListComponent },
    { path: 'chat/:id', component: ChatComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'video-call/:roomId', component: VideoCallComponent },
    { path: '**', redirectTo: '' }
];
