import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'signup',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'user-list',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'profile',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'chat/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'video-call/:roomId',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server 
  }
];
