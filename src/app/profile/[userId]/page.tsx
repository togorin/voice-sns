'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// 型定義を更新
type Profile = {
  username: string;
  avatar_url: string | null;
  bio: string | null; // bioを追加
};

type Post = {
  id: string;
  created_at: string;
  audio_url: string;
};

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // 自己紹介編集用のstate
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // プロフィール情報を取得
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio') // bioも取得
        .eq('id', userId)
        .single();
      if (profileData) {
        setProfile(profileData);
        setBioText(profileData.bio || '');
      }

      // 投稿一覧を取得
      const { data: postData } = await supabase
        .from('posts')
        .select('id, created_at, audio_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (postData) setPosts(postData);

      // フォロー状態を確認
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

  // 自己紹介を保存する処理
  const handleSaveBio = async () => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('profiles')
      .update({ bio: bioText })
      .eq('id', currentUser.id);

    if (error) {
      alert('Error updating bio.');
    } else {
      // プロフィール情報を更新し、編集モードを終了
      setProfile(prev => prev ? { ...prev, bio: bioText } : null);
      setIsEditingBio(false);
    }
  };
  
  const handleFollow = async () => { /* ... */ };
  const handleUnfollow = async () => { /* ... */ };

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
          <h1 className="text-2xl font-bold text-white">{profile?.username || 'User'}</h1>
          
          {/* 自己紹介の表示・編集エリア */}
          <div className="mt-4 min-h-[6rem]">
            {currentUser?.id === userId && isEditingBio ? (
              // 編集モード
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
              // 表示モード
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
            currentUser?.id === userId ? null : // 自分のプロフィールの場合はフォローボタンを非表示
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
