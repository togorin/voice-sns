'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// 型定義を更新
type Like = { user_id: string; };
type Profile = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};
type Post = {
  id: string;
  created_at: string;
  audio_url: string;
  title: string | null;
  likes: Like[]; // likesを追加
};

// TimeAgoコンポーネント
const TimeAgo = ({ date }: { date: string }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const calculateTimeAgo = () => {
      const now = new Date();
      const past = new Date(date);
      const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

      const days = Math.floor(seconds / 86400);
      const weeks = Math.floor(seconds / 604800);
      const months = Math.floor(seconds / 2592000);

      if (days === 1) {
        setTimeAgo("yesterday");
        return;
      }
      if (weeks === 1) {
        setTimeAgo("last week");
        return;
      }
      if (months === 1) {
        setTimeAgo("last month");
        return;
      }

      // fallback: 通常の "X time ago"
      let interval = seconds / 31536000;
      if (interval >= 1) {
        const years = Math.floor(interval);
        setTimeAgo(years === 1 ? "1 year ago" : years + " years ago");
        return;
      }
      interval = seconds / 2592000;
      if (interval >= 1) {
        const m = Math.floor(interval);
        setTimeAgo(m === 1 ? "1 month ago" : m + " months ago");
        return;
      }
      interval = seconds / 604800;
      if (interval >= 1) {
        const w = Math.floor(interval);
        setTimeAgo(w === 1 ? "1 week ago" : w + " weeks ago");
        return;
      }
      interval = seconds / 86400;
      if (interval >= 1) {
        const d = Math.floor(interval);
        setTimeAgo(d === 1 ? "1 day ago" : d + " days ago");
        return;
      }
      interval = seconds / 3600;
      if (interval >= 1) {
        const h = Math.floor(interval);
        setTimeAgo(h === 1 ? "1 hour ago" : h + " hours ago");
        return;
      }
      interval = seconds / 60;
      if (interval >= 1) {
        const min = Math.floor(interval);
        setTimeAgo(min === 1 ? "1 minute ago" : min + " minutes ago");
        return;
      }
      setTimeAgo(seconds <= 1 ? "just now" : seconds + " seconds ago");
    };
    calculateTimeAgo();
    const timer = setInterval(calculateTimeAgo, 60000);

    return () => clearInterval(timer);
  }, [date]);

  return <p className="text-xs text-gray-500">{timeAgo}</p>;
};


export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameText, setUsernameText] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: profileData } = await supabase.from('profiles').select('username, avatar_url, bio').eq('id', userId).single();
      if (profileData) {
        setProfile(profileData);
        setBioText(profileData.bio || '');
        setUsernameText(profileData.username || '');
      }

       // 24時間制限を削除し、すべての投稿を取得するように変更

      const { data: postData } = await supabase
        .from('posts')
        .select('id, created_at, audio_url, title , likes(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (postData) setPosts(postData as Post[]);
      if (user) {
        const { data: followData } = await supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', userId).single();
        setIsFollowing(!!followData);
      }
      setLoading(false);
    };
    fetchProfileData();
  }, [userId]);
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || currentUser.id !== userId) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${currentUser.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      alert('Error uploading avatar.');
      console.error(uploadError);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', currentUser.id);
    if (updateError) {
      alert('Error updating profile.');
    } else {
      window.location.reload();
    }
  };
  
  const handleSaveBio = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('profiles').update({ bio: bioText }).eq('id', currentUser.id);
    if (error) {
      alert('Error updating bio.');
    } else {
      setProfile(prev => prev ? { ...prev, bio: bioText } : null);
      setIsEditingBio(false);
    }
  };
  
  const handleSaveUsername = async () => {
    if (!currentUser || !usernameText) return;
    const { error } = await supabase.from('profiles').update({ username: usernameText }).eq('id', currentUser.id);
    if (error) {
      alert('Error updating username. It might already be taken.');
    } else {
      setProfile(prev => prev ? { ...prev, username: usernameText } : null);
      setIsEditingUsername(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return alert('Please log in to follow users.');
    const { error } = await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: userId });
    if (error) console.error('Error following user:', error);
    else setIsFollowing(true);
  };
  
  const handleUnfollow = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
    if (error) console.error('Error unfollowing user:', error);
    else setIsFollowing(false);
  };

  const handleDelete = async (post: Post) => {
    if (!currentUser || currentUser.id !== userId) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    setPosts(posts.filter(p => p.id !== post.id));
    const filePath = new URL(post.audio_url).pathname.split('/voice-memos/')[1];
    await supabase.storage.from('voice-memos').remove([filePath]);
    await supabase.from('posts').delete().eq('id', post.id);
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    setPosts(posts.map(post => post.id === postId ? { ...post, likes: [...post.likes, { user_id: currentUser.id }] } : post));
    await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
  };

  const handleUnlike = async (postId: string) => {
    if (!currentUser) return;
    setPosts(posts.map(post => post.id === postId ? { ...post, likes: post.likes.filter(like => like.user_id !== currentUser.id) } : post));
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
  };

  const handleShare = (post: Post) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `stew post by ${profile?.username || 'a user'}`,
        url: postUrl,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(postUrl);
      alert('Post URL copied to clipboard!');
    }
  };

  return (
      <main className="min-h-screen bg-gray-900 pb-24">

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">

        <div className="w-1/3">

          {/* Back button can be added here if needed */}

        </div>

        <h1 className="font-unbounded w-1/3 text-center text-3xl font-bold text-white">stew</h1>

        <div className="flex w-1/3 justify-end">

          {loading ? (

            <div className="h-[30px] w-[76px]"></div>

          ) : currentUser ? (

            <button onClick={handleLogout} className="rounded-md bg-gray-700 px-4 py-1.5 text-sm font-semibold text-gray-200 hover:bg-gray-600">Logout</button>

          ) : (

            <Link href="/" className="rounded-md bg-[#D3FE3E] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#c2ef25]">Login</Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-md p-4">
        {/* Profile Card */}
        <div className="rounded-lg bg-gray-800 p-8 text-center shadow-lg">
          <div className="relative mx-auto mb-4 h-32 w-32">
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile?.username || '?'}`}
              alt="Avatar"
              className="h-full w-full rounded-full object-cover"
            />
            {currentUser?.id === userId && (
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600">
                +
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2">
            {isEditingUsername ? (
              <input 
                type="text"
                value={usernameText}
                onChange={(e) => setUsernameText(e.target.value)}
                className="rounded-md border border-gray-600 bg-gray-700 p-1 text-center text-2xl font-bold text-white"
              />
            ) : (
              <h1 className="text-2xl font-bold text-white">{profile?.username || 'User'}</h1>
            )}
            {currentUser?.id === userId && !isEditingUsername && (
              <button onClick={() => setIsEditingUsername(true)} className="text-blue-400 hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
          {isEditingUsername && (
            <div className="mt-2 flex justify-center gap-2">
              <button onClick={() => setIsEditingUsername(false)} className="rounded-md bg-gray-600 px-3 py-1 text-sm text-white">Cancel</button>
              <button onClick={handleSaveUsername} className="rounded-md bg-green-600 px-3 py-1 text-sm text-white">Save</button>
            </div>
          )}

          <div className="my-4 min-h-[3rem]">
            {currentUser?.id === userId && isEditingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditingBio(false)} className="rounded-md bg-gray-600 px-3 py-1 text-sm text-white">Cancel</button>
                  <button onClick={handleSaveBio} className="rounded-md bg-green-600 px-3 py-1 text-sm text-white">Save</button>
                </div>
              </div>
            ) : (
                <p className="whitespace-pre-wrap text-left text-sm text-gray-400">
                {profile?.bio || (currentUser?.id === userId ? 'Click to add a bio' : '')}
              </p>
            )}
            {currentUser?.id === userId && !isEditingBio && (
              <button onClick={() => setIsEditingBio(true)} className="mt-2 text-sm text-blue-400 hover:underline">
                Edit Bio
              </button>
            )}
          </div>

          <div>
            {loading ? <p className="text-gray-400">Loading...</p> : 
            currentUser?.id === userId ? 
              null : 
            isFollowing ? <button onClick={handleUnfollow} className="rounded-md bg-gray-600 px-6 py-2 font-semibold text-gray-100 hover:bg-gray-700">Unfollow</button> : 
            <button onClick={handleFollow} className="rounded-md bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600">Follow</button>}
          </div>
        </div>

        {/* Posts List */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-white">Posts</h2>
          <div className="space-y-6">
            {posts.length > 0 ? posts.map((post) => {
              const userHasLiked = currentUser ? post.likes.some(like => like.user_id === currentUser.id) : false;
              return (
                <div key={post.id} className="rounded-lg bg-gray-800 p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <TimeAgo date={post.created_at} />
                    {currentUser?.id === userId && (
                      <button onClick={() => handleDelete(post)} className="text-gray-500 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                      </button>
                    )}
                  </div>
                  {post.title && (
                    <p className="mt-2 mb-3 text-sm text-white">{post.title}</p>
                  )}
                  <audio src={post.audio_url} controls className="w-full" />
                  <div className="mt-4 flex items-center gap-4">
                    <button onClick={() => userHasLiked ? handleUnlike(post.id) : handleLike(post.id)} className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-6 w-6 transition-colors ${userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}><path fillRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" clipRule="evenodd" /></svg>
                      <span className="text-sm text-gray-400">{post.likes.length}</span>
                    </button>
                    <button onClick={() => handleShare(post)} className="text-gray-500 hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <polyline points="15 14 20 9 15 4"></polyline><path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            }) : <p className="text-center text-gray-400">No posts yet.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
