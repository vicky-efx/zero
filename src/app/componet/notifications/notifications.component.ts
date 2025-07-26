import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';


@Component({
  selector: 'app-notifications',
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent {

  notifications = [
    { avatar: 'https://i.pravatar.cc/150?img=11', username: 'Aisha', message: 'liked your photo.', time: '2 min ago' },
    { avatar: 'https://i.pravatar.cc/150?img=12', username: 'David', message: 'started following you.', time: '10 min ago' },
    { avatar: 'https://i.pravatar.cc/150?img=13', username: 'Sana', message: 'commented: "Awesome shot 😍"', time: '1 hour ago' },
    { avatar: 'https://i.pravatar.cc/150?img=14', username: 'Liam', message: 'mentioned you in a comment.', time: '3 hours ago' },
    { avatar: 'https://i.pravatar.cc/150?img=15', username: 'Emily', message: 'sent you a friend request.', time: '5 hours ago' },
    { avatar: 'https://i.pravatar.cc/150?img=16', username: 'Noah', message: 'tagged you in a post.', time: 'Yesterday' },
    { avatar: 'https://i.pravatar.cc/150?img=17', username: 'Olivia', message: 'reacted ❤️ to your story.', time: '2 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=18', username: 'Lucas', message: 'liked your video.', time: '3 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=19', username: 'Emma', message: 'shared your reel.', time: '4 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=20', username: 'Ethan', message: 'replied to your comment.', time: '5 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=21', username: 'Sophia', message: 'viewed your profile.', time: '6 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=22', username: 'Logan', message: 'liked your reel.', time: '1 week ago' },
    { avatar: 'https://i.pravatar.cc/150?img=23', username: 'Mia', message: 'sent you a message.', time: '1 week ago' },
    { avatar: 'https://i.pravatar.cc/150?img=24', username: 'James', message: 'added you to a group.', time: '8 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=25', username: 'Ava', message: 'commented on your video.', time: '9 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=26', username: 'Benjamin', message: 'sent a voice message.', time: '10 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=27', username: 'Isabella', message: 'reacted 😂 to your message.', time: '11 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=28', username: 'Henry', message: 'liked your comment.', time: '12 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=29', username: 'Charlotte', message: 'shared your post.', time: '13 days ago' },
    { avatar: 'https://i.pravatar.cc/150?img=30', username: 'Sebastian', message: 'sent you a gift.', time: '2 weeks ago' },
    { avatar: 'https://i.pravatar.cc/150?img=31', username: 'Amelia', message: 'tagged you in a story.', time: '2 weeks ago' },
    { avatar: 'https://i.pravatar.cc/150?img=32', username: 'Jack', message: 'sent you a sticker.', time: '2 weeks ago' },
    { avatar: 'https://i.pravatar.cc/150?img=33', username: 'Harper', message: 'liked your status.', time: '3 weeks ago' },
    { avatar: 'https://i.pravatar.cc/150?img=34', username: 'Owen', message: 'commented: "So cool!"', time: '3 weeks ago' },
    { avatar: 'https://i.pravatar.cc/150?img=35', username: 'Ella', message: 'reacted 🔥 to your story.', time: '3 weeks ago' },
    { avatar: 'https://i.pravatar.cc/150?img=36', username: 'Daniel', message: 'sent you a wave 👋.', time: '1 month ago' },
    { avatar: 'https://i.pravatar.cc/150?img=37', username: 'Grace', message: 'saved your post.', time: '1 month ago' },
    { avatar: 'https://i.pravatar.cc/150?img=38', username: 'Matthew', message: 'joined your live.', time: '1 month ago' },
    { avatar: 'https://i.pravatar.cc/150?img=39', username: 'Chloe', message: 'sent you a snap.', time: '1 month ago' },
    { avatar: 'https://i.pravatar.cc/150?img=40', username: 'Alexander', message: 'liked your comment.', time: '1 month ago' }
  ];


  constructor(private location: Location) { }

  goBack() {
    this.location.back(); // ✅ Now it works
  }
}
