'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';

// 各アイコンのSVGコンポーネント
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const RecordIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

// 塗りつぶしアイコン
const HomeIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>;
const ProfileIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const SearchIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;


export default function TabBar() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  const handleRecordClick = () => {
    if (currentUser) {
      router.push('/record');
    } else {
      alert('Hop in — log in or sign up to post & like!\nポストやいいねをするにはログインしてね！');
    }
  };

  const isHomePage = pathname === '/home';
  const isSearchPage = pathname === '/search';
  const isProfilePage = currentUser ? pathname.startsWith(`/profile/${currentUser.id}`) : false;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-700 bg-gray-800">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        <Link href="/home" className={isHomePage ? 'text-white' : 'text-gray-400 hover:text-white'}>
          {isHomePage ? <HomeIconFilled /> : <HomeIcon />}
        </Link>
        
        <Link href="/search" className={isSearchPage ? 'text-white' : 'text-gray-400 hover:text-white'}>
          {isSearchPage ? <SearchIconFilled /> : <SearchIcon />}
        </Link>

        <div className="w-20"></div> 

        {currentUser ? (
          <Link href={`/profile/${currentUser.id}`} className={isProfilePage ? 'text-white' : 'text-gray-400 hover:text-white'}>
            {isProfilePage ? <ProfileIconFilled /> : <ProfileIcon />}
          </Link>
        ) : (
          <button onClick={handleRecordClick} className="text-gray-400 hover:text-white">
            <ProfileIcon />
          </button>
        )}
      </div>
      
      <button 
        onClick={handleRecordClick}
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[35%] flex h-20 w-20 items-center justify-center rounded-full bg-[#5151EB] text-white shadow-lg"
      >
        <RecordIcon />
      </button>
    </nav>
  );
}
