'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; // useRouterを追加
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

// TimeAgoコンポーネント
const TimeAgo = ({ date }: { date: string }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const calculateTimeAgo = () => {
      const now = new Date();
      const past = new Date(date);
      const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
      let interval = seconds / 31536000;

      if (interval >= 1) {
        const years = Math.floor(interval);
        setTimeAgo(years === 1 ? "last year" : years + " years ago");
        return;
      }
      interval = seconds / 2592000;
      if (interval >= 1) {
        const months = Math.floor(interval);
        setTimeAgo(months === 1 ? "last month" : months + " months ago");
        return;
      }
      interval = seconds / 604800;
      if (interval >= 1) {
        const weeks = Math.floor(interval);
        setTimeAgo(weeks === 1 ? "last week" : weeks + " weeks ago");
        return;
      }
      interval = seconds / 86400;
      if (interval >= 1) {
        const days = Math.floor(interval);
        setTimeAgo(days === 1 ? "yesterday" : days + " days ago");
        return;
      }
      interval = seconds / 3600;
      if (interval >= 1) {
        const hours = Math.floor(interval);
        setTimeAgo(hours + (hours === 1 ? " hour ago" : " hours ago"));
        return;
      }
      interval = seconds / 60;
      if (interval >= 1) {
        const minutes = Math.floor(interval);
        setTimeAgo(minutes + (minutes === 1 ? " minute ago" : " minutes ago"));
        return;
      }
      setTimeAgo(Math.floor(seconds) + (seconds === 1 ? " second ago" : " seconds ago"));
    };

    calculateTimeAgo();
    // 1分ごとに更新
    const timer = setInterval(calculateTimeAgo, 60000);

    return () => clearInterval(timer);
  }, [date]);

  return <p className="text-xs text-gray-500">{timeAgo}</p>;
};

export default function PostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
 const router = useRouter(); // useRouterを準備

  // ログアウト処理を追加
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
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

  const handleProtectedAction = () => {

    if (!currentUser) {

      alert('Hop in — log in or sign up to post & like!\nポストやいいねをするにはログインしてね！');
      return false;
    }
    return true;

  };



  const handleLike = async () => {
    if (!handleProtectedAction() || !post) return;
    setPost({ ...post, likes: [...post.likes, { user_id: currentUser!.id }] });
    await supabase.from('likes').insert({ post_id: postId, user_id: currentUser!.id });

  };



  const handleUnlike = async () => {

    if (!handleProtectedAction() || !post) return;
    setPost({ ...post, likes: post.likes.filter(like => like.user_id !== currentUser!.id) });
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser!.id);
  };

 // シェア処理を追加

  const handleShare = () => {
    if (!post) return;
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `stew post by ${post.profiles?.username || 'a user'}`,
        url: postUrl,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(postUrl);
      alert('Post URL copied to clipboard!');
    }

  };

  const userHasLiked = currentUser && post ? post.likes.some(like => like.user_id === currentUser.id) : false;

  return (
   <main className="min-h-screen bg-gray-900 pb-24">

      {/* ヘッダーをホーム画面と同じデザインに変更 */}

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <div className="w-1/3">
            <Link href="/home" className="text-[#D3FE3E] hover:text-[#c2ef25]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
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
                  <TimeAgo date={post.created_at} />
                </div>
              </div>
            </div>
            {post.title && (
              <p className="mb-3 text-sm text-white">{post.title}</p>
            )}
            <audio 
              src={post.audio_url} 
              controls 
              controlsList="nodownload" 
              className="w-full" 
            />
                   <div className="mt-4 flex items-center gap-4">
              <button onClick={() => userHasLiked ? handleUnlike() : handleLike()} className="flex items-center gap-1.5">

                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-6 w-6 transition-colors ${userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}>

                  <path fillRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" clipRule="evenodd" />

                </svg>

                <span className="ml-2 text-sm text-gray-400">{post.likes.length}</span>

              </button>

              {/* シェアボタンを追加 */}

              <button onClick={handleShare} className="text-gray-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <polyline points="15 14 20 9 15 4"></polyline><path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
