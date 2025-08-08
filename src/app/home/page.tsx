'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// 型定義
type Like = { user_id: string };
type Post = {
  id: string;
  created_at: string;
  audio_url: string;
  user_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
  likes: Like[];
};

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const audioRefs = useRef<Map<string, HTMLAudioElement | null>>(new Map());

  // ---- ログアウト処理 ----
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // ログアウト先はログインページ（/）と仮定
    router.push('/');
    // 状態を確実に更新
    router.refresh();
  };

  // ---- 初期データ取得 + 認証状態リスナー ----
  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      setLoading(true);
      // current user を取得（最初の確認）
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setCurrentUser(user);

      // 直近24時間分を取得（全ユーザー分）
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles (username, avatar_url), likes (*)')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } else {
        // likes/profile が null の可能性を正規化しておく
        const normalized = (data ?? []).map((d: any) => ({
          id: d.id,
          created_at: d.created_at,
          audio_url: d.audio_url,
          user_id: d.user_id,
          profiles: d.profiles ?? null,
          likes: d.likes ?? [],
        })) as Post[];
        setPosts(normalized);
      }

      setLoading(false);
    };

    fetchPosts();

    // 認証状態変更を監視（ログイン・ログアウトの反映）
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      // 場合によっては再フェッチしたいなら以下を有効化
      // fetchPosts();
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // ---- 未ログインユーザーが操作したときのガード ----
  const handleProtectedAction = (): boolean => {
    if (!currentUser) {
      // 日本語メッセージにするならここを書き換えてください
      alert('サインアップまたはログインしてください。');
      router.push('/'); // ログインページへ誘導
      return false;
    }
    return true;
  };

  // ---- いいね（楽観更新 + 二重防止 + エラーハンドリング） ----
  const handleLike = async (postId: string) => {
    if (!handleProtectedAction()) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // 既にいいね済みなら何もしない
    const alreadyLiked = post.likes.some((l) => l.user_id === currentUser!.id);
    if (alreadyLiked) return;

    // optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: [...p.likes, { user_id: currentUser!.id }] } : p))
    );

    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: currentUser!.id });

    if (error) {
      console.error('Error inserting like:', error);
      // rollback
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: p.likes.filter((l) => l.user_id !== currentUser!.id) } : p)));
      // 必要ならユーザーに知らせる
      alert('いいねに失敗しました。もう一度お試しください。');
    }
  };

  // ---- いいね解除（同上） ----
  const handleUnlike = async (postId: string) => {
    if (!handleProtectedAction()) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const alreadyLiked = post.likes.some((l) => l.user_id === currentUser!.id);
    if (!alreadyLiked) return;

    // optimistic remove
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: p.likes.filter((l) => l.user_id !== currentUser!.id) } : p)));

    const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser!.id);

    if (error) {
      console.error('Error unliking:', error);
      // rollback (再追加)
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: [...p.likes, { user_id: currentUser!.id }] } : p)));
      alert('いいね解除に失敗しました。もう一度お試しください。');
    }
  };

  // ---- 投稿削除（投稿者のみ） ----
  const handleDelete = async (post: Post) => {
    if (!handleProtectedAction()) return;
    if (currentUser!.id !== post.user_id) {
      alert('You can only delete your own posts.');
      return;
    }
    if (!confirm('Are you sure you want to delete this post?')) return;

    // optimistic remove
    const previous = posts;
    setPosts((prev) => prev.filter((p) => p.id !== post.id));

    try {
      // ファイル削除（storage）
      const filePath = new URL(post.audio_url).pathname.split('/voice-memos/')[1];
      if (filePath) {
        const { error: storageErr } = await supabase.storage.from('voice-memos').remove([filePath]);
        if (storageErr) console.warn('Storage remove error:', storageErr);
      }

      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) {
        console.error('Error deleting post:', error);
        setPosts(previous); // rollback
        alert('投稿の削除に失敗しました。');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setPosts(previous);
      alert('投稿の削除に失敗しました。');
    }
  };

  // ---- 再生時に他の音声を止める ----
  const handlePlay = (postId: string) => {
    audioRefs.current.forEach((audioEl, id) => {
      if (id !== postId && audioEl) audioEl.pause();
    });
  };

  return (
    <main className="min-h-screen bg-gray-900 pb-24">
      {/* ヘッダー：ログイン状態に応じてボタンを切り替え */}
      <header className="sticky top-0 flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <div className="w-1/3" />
        <h1 className="font-unbounded w-1/3 text-center text-3xl font-bold text-white">stew</h1>
        <div className="flex w-1/3 justify-end">
          {currentUser ? (
            <button onClick={handleLogout} className="rounded-md bg-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-gray-600">
              Logout
            </button>
          ) : (
            <Link href="/" className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
              Login
            </Link>
          )}
        </div>
      </header>

      {/* コンテンツ */}
      <div className="p-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-400">No posts to show.</p>
        ) : (
          <div className="mx-auto max-w-md space-y-6">
            {posts.map((post) => {
              const userHasLiked = currentUser ? post.likes.some((like) => like.user_id === currentUser.id) : false;
              return (
                <div key={post.id} className="rounded-lg bg-gray-800 p-5 shadow-lg">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${post.user_id}`}>
                        <img
                          src={post.profiles?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${post.profiles?.username || '?'}`}
                          alt="Avatar"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </Link>
                      <div>
                        <Link href={`/profile/${post.user_id}`} className="hover:underline">
                          <p className="text-sm font-semibold text-gray-100">{post.profiles?.username || 'Unknown User'}</p>
                        </Link>
                        <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* 投稿者なら削除ボタン表示 */}
                    {currentUser?.id === post.user_id && (
                      <button onClick={() => handleDelete(post)} className="text-gray-500 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <audio
                    src={post.audio_url}
                    controls
                    controlsList="nodownload"
                    ref={(el) => {
                      audioRefs.current.set(post.id, el);
                    }}
                    onPlay={() => handlePlay(post.id)}
                    className="w-full"
                  />

                  <div className="mt-4 flex items-center">
                    <button onClick={() => (userHasLiked ? handleUnlike(post.id) : handleLike(post.id))}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-6 w-6 transition-colors ${userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}>
                        <path fillRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="ml-2 text-sm text-gray-400">{post.likes.length}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 録音ページへ遷移するボタン（未ログインなら誘導） */}
      <button
        onClick={() => {
          if (handleProtectedAction()) router.push('/record');
        }}
        className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#5151EB] text-white shadow-lg transition-transform hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      </button>
    </main>
  );
}
