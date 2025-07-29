importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyC5heY918kwi3hyRtHIbe7FYXcKU1XtjLE',
    projectId: 'zero-9f9ac',
    messagingSenderId: '775389525323',
    appId: '1:775389525323:web:cb02d173d3fe7a05ebe4ce'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});