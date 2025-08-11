'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// タイムラインと同じPost型を定義
type Like = { user_id: string; };
type Post = {
  id: string;
  created_at: string;
  audio_url: string;
  user_id: string;
  title: string | null;
  profiles: { username: string; avatar_url: string | null; } | null;
  likes: Like[];
};

// Countdownコンポーネントも再利用
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

export default function PostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // postIdに一致する投稿を1件だけ取得
      const { data, error } = await supabase
        .from('posts')
        .select(`*, title, profiles (username, avatar_url), likes (*)`)
        .eq('id', postId)
        .single(); // .single()で1件だけ取得

      if (error) {
        console.error('Error fetching post:', error);
      } else {
        setPost(data as Post);
      }
      setLoading(false);
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // いいね/いいね解除のロジックはタイムラインと同じ
  const handleLike = async () => { /* ... */ };
  const handleUnlike = async () => { /* ... */ };

  return (
    <main className="min-h-screen bg-gray-900 p-4 pt-8 pb-24">
      <header className="mb-8">
        <Link href="/home" className="text-blue-400 hover:underline">
          &larr; Back to Timeline
        </Link>
      </header>

      <div className="mx-auto max-w-md">
        {loading ? (
          <p className="text-center text-gray-400">Loading post...</p>
        ) : !post ? (
          <p className="text-center text-gray-400">Post not found or has expired.</p>
        ) : (
          <div className="rounded-lg bg-gray-800 p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/profile/${post.user_id}`}>
                  <img src={post.profiles?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${post.profiles?.username || '?'}`} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
                </Link>
                <div>
                  <Link href={`/profile/${post.user_id}`} className="hover:underline">
                    <p className="text-sm font-semibold text-gray-100">{post.profiles?.username || 'Unknown User'}</p>
                  </Link>
                  <Countdown createdAt={post.created_at} />
                </div>
              </div>
            </div>
            {post.title && (
              <p className="mb-3 text-white">{post.title}</p>
            )}
            <audio 
              src={post.audio_url} 
              controls 
              controlsList="nodownload" 
              className="w-full" 
            />
            <div className="mt-4 flex items-center">
              {/* いいねボタン (ロジックは後で実装) */}
              <button>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-gray-500"><path fillRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" clipRule="evenodd" /></svg>
              </button>
              <span className="ml-2 text-sm text-gray-400">{post.likes.length}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
