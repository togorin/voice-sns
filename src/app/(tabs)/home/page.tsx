'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// 型定義
type Like = {
  user_id: string;
};

type Post = {
  id: string;
  created_at: string;
  audio_url: string;
  user_id: string;
  title: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
  likes: Like[];
};

// カウントダウン表示用のコンポーネント
const Countdown = ({ createdAt }: { createdAt: string }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expirationTime = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const difference = expirationTime - now;

      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft('Expired');
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return <p className="text-xs text-gray-500">{timeLeft}</p>;
};


export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const audioRefs = useRef<Map<string, HTMLAudioElement | null>>(new Map());

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase.from('posts').select(`*, title, profiles (username, avatar_url), likes (*)`).gte('created_at', twentyFourHoursAgo).order('created_at', { ascending: false });
      
      if (!error) setPosts(data as Post[]);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

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

  const handleDelete = async (post: Post) => {
    if (!currentUser || currentUser.id !== post.user_id) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    setPosts(posts.filter(p => p.id !== post.id));

    const filePath = new URL(post.audio_url).pathname.split('/voice-memos/')[1];
    await supabase.storage.from('voice-memos').remove([filePath]);
    await supabase.from('posts').delete().eq('id', post.id);
  };

  const handlePlay = (postId: string) => {
    audioRefs.current.forEach((audioEl, id) => {
      if (id !== postId && audioEl) {
        audioEl.pause();
      }
    });
  };

  // シェア処理
  const handleShare = (post: Post) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `stew post by ${post.profiles?.username || 'a user'}`,
        url: postUrl,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Web Share APIが使えない場合のフォールバック
      navigator.clipboard.writeText(postUrl);
      alert('Post URL copied to clipboard!');
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <div className="w-1/3"></div>
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
      <div className="p-4">
        {loading ? <p className="text-center text-gray-400">Loading posts...</p> : 
        posts.length === 0 ? <p className="text-center text-gray-400">No posts to show. Start by recording your first voice memo!</p> : 
        <div className="mx-auto max-w-md space-y-6">
          {posts.map((post) => {
            const userHasLiked = currentUser ? post.likes.some(like => like.user_id === currentUser.id) : false;
            return (
              <Link href={`/post/${post.id}`} key={post.id}>
                <div className="mb-5 rounded-lg bg-gray-800 p-5 shadow-lg transition-colors hover:bg-gray-700">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${post.user_id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                        <img src={post.profiles?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${post.profiles?.username || '?'}`} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
                      </Link>
                      <div>
                        <Link href={`/profile/${post.user_id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                          <p className="text-sm font-semibold text-gray-100">{post.profiles?.username || 'Unknown User'}</p>
                        </Link>
                        <Countdown createdAt={post.created_at} />
                      </div>
                    </div>
                    {currentUser?.id === post.user_id && (
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(post); }} className="text-gray-500 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                      </button>
                    )}
                  </div>
                  
                  {post.title && (
                    <p className="mb-3 text-sm text-white">{post.title}</p>
                  )}

                  <audio 
                    src={post.audio_url} 
                    controls 
                    controlsList="nodownload" 
                    ref={(el) => { audioRefs.current.set(post.id, el); }}
                    onPlay={(e) => { e.stopPropagation(); e.preventDefault(); handlePlay(post.id); }}
                    className="w-full" 
                  />

                  <div className="mt-4 flex items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); userHasLiked ? handleUnlike(post.id) : handleLike(post.id); }} className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-6 w-6 transition-colors ${userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}><path fillRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" clipRule="evenodd" /></svg>
                      <span className="text-sm text-gray-400">{post.likes.length}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleShare(post); }} className="text-gray-500 hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <polyline points="15 14 20 9 15 4"></polyline><path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>}
      </div>
    </main>
  );
}
