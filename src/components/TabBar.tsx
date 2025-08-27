'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';

// 各アイコンのSVGコンポーネント
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M386.14,575.13h166.98c51.86.05,93.88,42.09,93.92,93.95v156.54c0,17.25,14.08,31.3,31.33,31.3h166.98c17.27-.04,31.26-14.03,31.3-31.3v-409.54c.01-9.14-3.97-17.83-10.91-23.78L490.02,70.3c-11.7-10.15-29.07-10.15-40.77,0L73.57,392.28c-6.96,5.94-10.96,14.63-10.94,23.78v409.54c.04,17.27,14.03,31.26,31.3,31.3h167.01c17.27-.04,31.26-14.03,31.3-31.3v-156.51c.05-51.85,42.07-93.88,93.92-93.95h0ZM845.34,919.54h-166.98c-51.85-.05-93.87-42.07-93.92-93.92v-156.54c0-17.31-14.02-31.34-31.33-31.36h-166.98c-17.29.04-31.3,14.07-31.3,31.36v156.54c-.07,51.84-42.08,93.85-93.92,93.92H93.92c-51.84-.07-93.85-42.08-93.92-93.92v-409.54c0-27.46,11.97-53.47,32.8-71.36L408.51,22.78c35.1-30.37,87.17-30.37,122.27,0l375.71,322.02c20.81,17.85,32.79,43.91,32.77,71.33v409.54c-.05,51.85-42.07,93.87-93.92,93.92v-.03Z"/></svg>
const RecordIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
// BellIconをHeartIconに変更

const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;

// 塗りつぶしアイコン
const HomeIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M22.6,11.2,13.1,2.8A1.6,1.6,0,0,0,12,2.4a1.6,1.6,0,0,0-1.1.4L1.4,11.2A1.6,1.6,0,0,0,2.5,14H4v7a1,1,0,0,0,1,1H19a1,1,0,0,0,1-1V14h1.5A1.6,1.6,0,0,0,22.6,11.2Z" /></svg>;
const ProfileIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const SearchIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
// HeartIconFilledをいいねボタンと同じデザインに修正

const HeartIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" clipRule="evenodd" /></svg>;


export default function TabBar({ isVisible }: { isVisible: boolean }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // 未読通知数のstate
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    // ユーザーが通知ページにいる場合は、バッジを即座に消す
    if (pathname === '/notifications') {
      setUnreadNotifications(0);
    }
  
    // 未読件数を取得する関数
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('notified_id', currentUser.id)
        .eq('is_read', false);
      
      // ユーザーが通知ページにいない場合のみ、取得した未読件数をセットする
      if (pathname !== '/notifications') {
        setUnreadNotifications(count || 0);
      }
    };
    fetchUnreadCount();
  
    // リアルタイムで通知を監視
    const channel = supabase.channel('notification_count').on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `notified_id=eq.${currentUser.id}`
      },
      (payload) => {
        // ユーザーが通知ページにいない場合のみ、リアルタイムでバッジを更新
        if (pathname !== '/notifications') {
          if (payload.eventType === 'INSERT') {
            setUnreadNotifications(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE' && payload.new.is_read === true) {
            setUnreadNotifications(prev => Math.max(0, prev - 1));
          }
        }
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, pathname]); // ★ 依存配列に pathname を追加

  const handleRecordClick = () => {
    if (currentUser) {
      router.push('/record');
    } else {
      alert('Hop in — log in or sign up to post & like!\nポストやいいねをするにはログインしてね！');
    }
  };

  const isHomePage = pathname === '/home';
  const isSearchPage = pathname === '/search';
  const isNotificationsPage = pathname === '/notifications';
  const isProfilePage = currentUser ? pathname.startsWith(`/profile/${currentUser.id}`) : false;

  // ...
return (
  <nav className={`fixed bottom-0 left-0 right-0 z-10 border-t border-gray-700 bg-gray-800 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
    <div className="mx-auto flex h-16 max-w-md items-center justify-between px-6">
      {/* 左側のアイコングループ */}
      <div className="flex items-center gap-12">
        <Link href="/home" className={isHomePage ? 'text-white' : 'text-gray-400 hover:text-white'}>
          {isHomePage ? <HomeIconFilled /> : <HomeIcon />}
        </Link>
        <Link href="/search" className={isSearchPage ? 'text-white' : 'text-gray-400 hover:text-white'}>
          {isSearchPage ? <SearchIconFilled /> : <SearchIcon />}
        </Link>
      </div>

      {/* 中央の録音ボタンのためのスペーサー（削除） */}
      {/* <div className="w-20"></div> */}

      {/* 右側のアイコングループ */}
      <div className="flex items-center gap-12">
        <Link href="/notifications" className="relative text-gray-400 hover:text-white">
          {isNotificationsPage ? <HeartIconFilled /> : <HeartIcon />}
          {unreadNotifications > 0 && (
            <span className="notification-badge"></span>
          )}
        </Link>
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
    </div>
    
    {/* 録音ボタンのコードは変更なし */}
    <button 
      onClick={handleRecordClick}
      className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[35%] flex h-20 w-20 items-center justify-center rounded-full bg-[#5151EB] text-white shadow-lg"
    >
      <RecordIcon />
    </button>
  </nav>
);
}