'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Profileデータの型を定義
type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // 👇 追加
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // ログインしているユーザーを取得
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${searchTerm}%`);

    if (error) {
      console.error('Error searching users:', error);
    } else {
      setResults(data);
    }
    setLoading(false);
  };
  return (
    <main className="min-h-dvh bg-gray-900 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <div className="w-1/3"></div>

        <h1 className="font-unbounded w-1/3 text-center text-3xl font-bold text-white">stew</h1>

        <div className="flex w-1/3 justify-end">
          {loading ? (
            <div className="h-[30px] w-[76px]"></div>
          ) : currentUser ? (
            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-700 px-4 py-1.5 text-sm font-semibold text-gray-200 hover:bg-gray-600"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/"
              className="rounded-md bg-[#D3FE3E] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#c2ef25]"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      <div className="p-4">
        <div className="mx-auto max-w-md">
          {/* 検索フォーム */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="rounded-md bg-[#5151EB] px-4 py-2 font-semibold text-white hover:bg-[#4141d4]"
              disabled={loading}
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {/* 検索結果 */}
          <div className="mt-8 space-y-4">
            {results.map((profile) => (
              <Link href={`/profile/${profile.id}`} key={profile.id}>
                <div className="flex items-center gap-4 rounded-lg bg-gray-800 p-4 transition-colors hover:bg-gray-700">
                  <img
                    src={profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username || '?'}`}
                    alt="Avatar"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white">{profile.username}</p>
                    <p className="text-sm text-gray-400">{profile.bio || ''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
