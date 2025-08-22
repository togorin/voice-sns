'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// TypeScriptに、windowオブジェクトがwebkitAudioContextを持つ可能性を伝えます
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

// 型定義
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

// TimeAgoコンポーネント
const TimeAgo = ({ date }: { date: string }) => {
  const [timeAgo, setTimeAgo] = useState('');
  useEffect(() => {
    const calculateTimeAgo = () => {
      const now = new Date();
      const past = new Date(date);
      const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) { setTimeAgo(Math.floor(interval) + " year(s) ago"); return; }
      interval = seconds / 2592000;
      if (interval > 1) { setTimeAgo(Math.floor(interval) + " month(s) ago"); return; }
      interval = seconds / 604800;
      if (interval > 1) { setTimeAgo(Math.floor(interval) + " week(s) ago"); return; }
      interval = seconds / 86400;
      if (interval > 1) { setTimeAgo(Math.floor(interval) + " day(s) ago"); return; }
      interval = seconds / 3600;
      if (interval > 1) { setTimeAgo(Math.floor(interval) + " hour(s) ago"); return; }
      interval = seconds / 60;
      if (interval > 1) { setTimeAgo(Math.floor(interval) + " minute(s) ago"); return; }
      setTimeAgo(Math.floor(seconds) + " second(s) ago");
    };
    calculateTimeAgo();
    const timer = setInterval(calculateTimeAgo, 60000);
    return () => clearInterval(timer);
  }, [date]);
  return <p className="text-xs text-gray-500">{timeAgo}</p>;
};


export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // コメント機能用のstate
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      const { data, error } = await supabase.from('posts').select(`*, title, profiles (username, avatar_url), likes (*), comments (*, profiles(username, avatar_url))`).order('created_at', { ascending: false });
      
      if (!error) setPosts(data as Post[]);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const handleProtectedAction = () => {
    if (!currentUser) {
      alert('Hop in — log in or sign up to post & like!\nポストやいいねをするにはログインしてね！');
      return false;
    }
    return true;
  };

  const handleLike = async (postId: string) => {
    if (!handleProtectedAction()) return;
    setPosts(posts.map(post => post.id === postId ? { ...post, likes: [...post.likes, { user_id: currentUser!.id }] } : post));
    await supabase.from('likes').insert({ post_id: postId, user_id: currentUser!.id });
  };

  const handleUnlike = async (postId: string) => {
    if (!handleProtectedAction()) return;
    setPosts(posts.map(post => post.id === postId ? { ...post, likes: post.likes.filter(like => like.user_id !== currentUser!.id) } : post));
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser!.id);
  };

  const handleDelete = async (post: Post) => {
    if (!handleProtectedAction() || currentUser!.id !== post.user_id) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    setPosts(posts.filter(p => p.id !== post.id));
    const filePath = new URL(post.audio_url).pathname.split('/voice-memos/')[1];
    await supabase.storage.from('voice-memos').remove([filePath]);
    await supabase.from('posts').delete().eq('id', post.id);
  };

  const handlePlay = async (post: Post) => {
    if (sourceRef.current) sourceRef.current.stop();
    if (currentlyPlaying === post.id) {
      setCurrentlyPlaying(null);
      return;
    }
    setCurrentlyPlaying(post.id);
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const response = await fetch(post.audio_url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      sourceRef.current = source;
      if (audioBuffer.numberOfChannels === 1) {
        const merger = audioContext.createChannelMerger(2);
        source.connect(merger);
        merger.connect(audioContext.destination);
      } else {
        source.connect(audioContext.destination);
      }
      source.onended = () => setCurrentlyPlaying(null);
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
      setCurrentlyPlaying(null);
    }
  };

  const handleShare = (post: Post) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `stew post by ${post.profiles?.username || 'a user'}`,
        url: postUrl,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(postUrl);
      alert('Post URL copied to clipboard!');
    }
  };
  
  const handlePostComment = async (postId: string) => {
    if (!handleProtectedAction() || !newComment.trim()) return;
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: currentUser!.id, content: newComment })
      .select('*, profiles(username, avatar_url)')
      .single();
    if (error) {
      console.error('Error posting comment:', error);
    } else if (data) {
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, data as Comment] } : p));
      setNewComment('');
    }
  };

  return (
    <main className="min-h-dvh bg-gray-900 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <div className="w-1/3"></div>
        <h1 className="font-unbounded w-1/3 text-center text-3xl font-bold text-white">stew</h1>
        <div className="flex w-1/3 justify-end">
           {loading ? <div className="h-[30px] w-[76px]"></div> : currentUser ? <button onClick={handleLogout} className="rounded-md bg-gray-700 px-4 py-1.5 text-sm font-semibold text-gray-200 hover:bg-gray-600">Logout</button> : <Link href="/" className="rounded-md bg-[#D3FE3E] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#c2ef25]">Login</Link>}
        </div>
      </header>
      <div className="p-4">
        {loading ? <p className="text-center text-gray-400">Loading posts...</p> : 
        <div className="mx-auto max-w-md space-y-6">
          {posts.map((post) => {
            const userHasLiked = currentUser ? post.likes.some(like => like.user_id === currentUser.id) : false;
            const isPlaying = currentlyPlaying === post.id;
            const isCommentOpen = openCommentPostId === post.id;

            return (
              <div key={post.id} className="rounded-lg bg-gray-800 p-5 shadow-lg">
                <div onClick={() => router.push(`/post/${post.id}`)} className="cursor-pointer">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${post.user_id}`} onClick={(e) => e.stopPropagation()}><img src={post.profiles?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${post.profiles?.username || '?'}`} alt="Avatar" className="h-10 w-10 rounded-full object-cover" /></Link>
                      <div>
                        <Link href={`/profile/${post.user_id}`} onClick={(e) => e.stopPropagation()} className="hover:underline"><p className="text-sm font-semibold text-gray-100">{post.profiles?.username || 'Unknown User'}</p></Link>
                        <TimeAgo date={post.created_at} />
                      </div>
                    </div>
                    {currentUser?.id === post.user_id && (<button onClick={(e) => { e.stopPropagation(); handleDelete(post); }} className="text-gray-500 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>)}
                  </div>
                  {post.title && (<p className="mb-3 text-sm text-white">{post.title}</p>)}
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); handlePlay(post); }} className="text-white">
                      {isPlaying ? <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
                    </button>
                    <div className="text-gray-400">Click to play</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-gray-700 pt-4">
                  <button onClick={() => userHasLiked ? handleUnlike(post.id) : handleLike(post.id)} className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-6 w-6 transition-colors ${userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}><path fillRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" clipRule="evenodd" /></svg>
                    <span className="text-sm text-gray-400">{post.likes.length}</span>
                  </button>
                  <button onClick={() => setOpenCommentPostId(isCommentOpen ? null : post.id)} className="flex items-center gap-1.5 text-gray-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <span className="text-sm">{post.comments.length}</span>
                  </button>
                  <button onClick={() => handleShare(post)} className="text-gray-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="15 14 20 9 15 4"></polyline><path d="M4 20v-7a4 4 0 0 1 4-4h12"></path></svg>
                  </button>
                </div>
                {isCommentOpen && (
                  <div className="mt-4 space-y-4 border-t border-gray-700 pt-4">
                    {currentUser && (
                      <div className="flex gap-2">
                        <input type="text" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-grow rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                        <button onClick={() => handlePostComment(post.id)} className="rounded-md bg-[#5151EB] px-4 font-semibold text-white hover:bg-[#4141d4]">Post</button>
                      </div>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <Link href={`/profile/${comment.user_id}`}><img src={comment.profiles?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${comment.profiles?.username || '?'}`} alt="Avatar" className="h-8 w-8 rounded-full object-cover" /></Link>
                        <div className="flex-grow rounded-md bg-gray-700 p-3">
                          <div className="flex items-center justify-between">
                            <Link href={`/profile/${comment.user_id}`} className="hover:underline"><p className="text-sm font-semibold text-white">{comment.profiles?.username || 'Unknown'}</p></Link>
                            {currentUser?.id === comment.user_id && (<button onClick={() => {}} className="text-gray-500 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>)}
                          </div>
                          <p className="mt-1 text-gray-300">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>}
      </div>
    </main>
  );
}
