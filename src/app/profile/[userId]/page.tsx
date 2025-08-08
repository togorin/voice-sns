'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// 型定義
type Profile = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

type Post = {
  id: string;
  created_at: string;
  audio_url: string;
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
  
  // 編集用のstate
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameText, setUsernameText] = useState('');


  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', userId)
        .single();
      if (profileData) {
        setProfile(profileData);
        setBioText(profileData.bio || '');
        setUsernameText(profileData.username || '');
      }

      // 24時間前の時刻を計算
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: postData } = await supabase
        .from('posts')
        .select('id, created_at, audio_url')
        .eq('user_id', userId)
        .gte('created_at', twentyFourHoursAgo) // 24時間以内の投稿のみ取得
        .order('created_at', { ascending: false });
      if (postData) setPosts(postData);

      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single();
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
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      alert('Error uploading avatar.');
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
    const { error } = await supabase
      .from('profiles')
      .update({ bio: bioText })
      .eq('id', currentUser.id);

    if (error) {
      alert('Error updating bio.');
    } else {
      setProfile(prev => prev ? { ...prev, bio: bioText } : null);
      setIsEditingBio(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!currentUser || !usernameText) return;
    const { error } = await supabase
      .from('profiles')
      .update({ username: usernameText })
      .eq('id', currentUser.id);
    
    if (error) {
      alert('Error updating username. It might already be taken.');
    } else {
      setProfile(prev => prev ? { ...prev, username: usernameText } : null);
      setIsEditingUsername(false);
    }
  };
  
  const handleProtectedAction = () => {
    if (!currentUser) {
      alert('サインアップ or ログインしてください');
      router.push('/');
      return false;
    }
    return true;
  };

  const handleFollow = async () => {
    if (!handleProtectedAction()) return;
    const { error } = await supabase.from('follows').insert({ follower_id: currentUser!.id, following_id: userId });
    if (error) console.error('Error following user:', error);
    else setIsFollowing(true);
  };
  
  const handleUnfollow = async () => {
    if (!handleProtectedAction()) return;
    const { error } = await supabase.from('follows').delete().eq('follower_id', currentUser!.id).eq('following_id', userId);
    if (error) console.error('Error unfollowing user:', error);
    else setIsFollowing(false);
  };

  return (
    <main className="min-h-screen bg-gray-900 p-4 pb-24">
      <header className="mb-8">
        <Link href="/home" className="text-blue-400 hover:underline">
          &larr; Back to Timeline
        </Link>
      </header>

      <div className="mx-auto max-w-md">
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

          <div className="mt-4 min-h-[6rem]">
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
              <p className="text-gray-400">
                {profile?.bio || (currentUser?.id === userId ? 'Click to add a bio' : '')}
              </p>
            )}
            {currentUser?.id === userId && !isEditingBio && (
              <button onClick={() => setIsEditingBio(true)} className="mt-2 text-sm text-blue-400 hover:underline">
                Edit Bio
              </button>
            )}
          </div>

          <div className="mt-6">
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
            {posts.length > 0 ? posts.map((post) => (
              <div key={post.id} className="rounded-lg bg-gray-800 p-5 shadow-lg">
                <p className="mb-3 text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                <audio src={post.audio_url} controls className="w-full" />
              </div>
            )) : <p className="text-center text-gray-400">No posts yet.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
