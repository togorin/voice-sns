'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

// 各アイコンのSVGコンポーネント
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const RecordIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

export default function TabBar() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-700 bg-gray-800">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        <Link href="/home" className="text-gray-400 hover:text-white">
          <HomeIcon />
        </Link>
        
        <div className="w-20"></div> 

        {currentUser ? (
          <Link href={`/profile/${currentUser.id}`} className="text-gray-400 hover:text-white">
            <ProfileIcon />
          </Link>
        ) : (
          <Link href="/" className="text-gray-400 hover:text-white">
            <ProfileIcon />
          </Link>
        )}
      </div>
      
      <Link 
        href="/record" 
        // -translate-y-1/2 を -translate-y-[35%] に変更して、ボタンを少し下に移動させました
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[35%] flex h-20 w-20 items-center justify-center rounded-full bg-[#5151EB] text-white shadow-lg"
      >
        <RecordIcon />
      </Link>
    </nav>
  );
}
