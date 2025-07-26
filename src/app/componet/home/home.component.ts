import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  posts = [
    {
      username: 'john_doe',
      avatar: 'https://i.pravatar.cc/150?img=3',
      imageUrl: 'https://picsum.photos/500/300?random=1',
      caption: 'Lovely day!',
      liked: false
    },
    {
      username: 'jane_smith',
      avatar: 'https://i.pravatar.cc/150?img=5',
      imageUrl: 'https://picsum.photos/500/300?random=2',
      caption: 'Sunset vibes!',
      liked: false
    },
    {
      username: 'travel_guru',
      avatar: 'https://i.pravatar.cc/150?img=9',
      imageUrl: 'https://picsum.photos/500/300?random=3',
      caption: 'Exploring the mountains 🏔️',
      liked: false
    },
    {
      username: 'foodie_life',
      avatar: 'https://i.pravatar.cc/150?img=11',
      imageUrl: 'https://picsum.photos/500/300?random=4',
      caption: 'Best pizza in town 🍕',
      liked: false
    },
    {
      username: 'artsy_annie',
      avatar: 'https://i.pravatar.cc/150?img=12',
      imageUrl: 'https://picsum.photos/500/300?random=5',
      caption: 'Watercolor therapy 🎨',
      liked: false
    },
    {
      username: 'code_master',
      avatar: 'https://i.pravatar.cc/150?img=15',
      imageUrl: 'https://picsum.photos/500/300?random=6',
      caption: 'Late night coding grind 💻',
      liked: false
    },
    {
      username: 'fitness_freak',
      avatar: 'https://i.pravatar.cc/150?img=17',
      imageUrl: 'https://picsum.photos/500/300?random=7',
      caption: 'No pain, no gain 🏋️‍♂️',
      liked: false
    },
    {
      username: 'pet_lover',
      avatar: 'https://i.pravatar.cc/150?img=19',
      imageUrl: 'https://picsum.photos/500/300?random=8',
      caption: 'Me and my pup 🐶',
      liked: false
    },
    {
      username: 'beach_bum',
      avatar: 'https://i.pravatar.cc/150?img=22',
      imageUrl: 'https://picsum.photos/500/300?random=9',
      caption: 'Beach day, best day 🏖️',
      liked: false
    },
    {
      username: 'bookworm',
      avatar: 'https://i.pravatar.cc/150?img=25',
      imageUrl: 'https://picsum.photos/500/300?random=10',
      caption: 'Currently reading: The Alchemist 📚',
      liked: false
    }
  ];

  newPost = {
    caption: '',
    imageUrl: '',
    avatar: 'https://i.pravatar.cc/150?img=7',
    username: 'me'
  };

  constructor(
    private router: Router
  ) { }

  handleImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.newPost.imageUrl = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  createPost() {
    if (this.newPost.caption && this.newPost.imageUrl) {
      this.posts.unshift({ ...this.newPost, liked: false });
      this.newPost.caption = '';
      this.newPost.imageUrl = '';
      // this.showCreateModal = false;
    }
  }

  toggleLike(post: any) {
    post.liked = !post.liked;
  }

  goto() {
    this.router.navigate(["/notification"])
  }


}
