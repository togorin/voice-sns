'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// Type Definitions
type Like = { user_id: string; };
type Profile = { username: string; avatar_url: string | null; };
type Comment = {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  profiles: Profile | null;
};
type Post = {
  id: string;
  created_at: string;
  audio_url: string;
  user_id: string;
  title: string | null;
  profiles: { username: string; avatar_url: string | null; } | null;
  likes: Like[];
  comments: Comment[];
};

// TimeAgo Component
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
  const [newComment, setNewComment] = useState('');
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data, error } = await supabase
        .from('posts')
        .select(`*, title, profiles (username, avatar_url), likes (*), comments (*, profiles(username, avatar_url))`)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        setPost(null);
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

  const handlePostComment = async () => {
    if (!handleProtectedAction() || !newComment.trim()) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: currentUser!.id, content: newComment })
      .select('*, profiles(username, avatar_url)')
      .single();
    
    if (error) {
      console.error('Error posting comment:', error);
    } else if (post && data) {
      setPost({ ...post, comments: [...post.comments, data as Comment] });
      setNewComment('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!handleProtectedAction()) return;
    if (!confirm('Are you sure you want to delete this comment?')) return;

    if (post) {
      setPost({ ...post, comments: post.comments.filter(c => c.id !== commentId) });
    }
    await supabase.from('comments').delete().eq('id', commentId);
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
          <>
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
                  <span className="text-sm text-gray-400">{post.likes.length}</span>
                </button>
                <button onClick={handleShare} className="text-gray-500 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="15 14 20 9 15 4"></polyline><path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold text-white">Comments ({post.comments.length})</h2>
              {currentUser && (
                <div className="mb-6 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-grow rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                  <button onClick={handlePostComment} className="rounded-md bg-[#5151EB] px-4 font-semibold text-white hover:bg-[#4141d4]">Post</button>
                </div>
              )}
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Link href={`/profile/${comment.user_id}`}>
                      <img src={comment.profiles?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${comment.profiles?.username || '?'}`} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
                    </Link>
                    <div className="flex-grow rounded-md bg-gray-700 p-3">
                      <div className="flex items-center justify-between">
                        <Link href={`/profile/${comment.user_id}`} className="hover:underline">
                          <p className="text-sm font-semibold text-white">{comment.profiles?.username || 'Unknown'}</p>
                        </Link>
                        {currentUser?.id === comment.user_id && (
                          <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-500 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-gray-300">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
