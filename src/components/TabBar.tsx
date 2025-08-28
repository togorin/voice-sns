'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';

// 各アイコンのSVGコンポーネント
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M418.144 639.168h166.976a94.016 94.016 0 0 1 93.92 93.952v156.544c0 17.248 14.08 31.296 31.328 31.296h166.976a31.36 31.36 0 0 0 31.296-31.296V480.128a31.264 31.264 0 0 0-10.912-23.776L522.016 134.336a31.104 31.104 0 0 0-40.768 0L105.568 456.32a31.2 31.2 0 0 0-10.944 23.776v409.536a31.36 31.36 0 0 0 31.296 31.296h167.008a31.36 31.36 0 0 0 31.296-31.296V733.12a94.048 94.048 0 0 1 93.92-93.952z m459.2 344.416h-166.976a94.016 94.016 0 0 1-93.92-93.92V733.12a31.36 31.36 0 0 0-31.328-31.36h-166.976a31.36 31.36 0 0 0-31.296 31.36v156.544a94.048 94.048 0 0 1-93.92 93.92H125.92A94.048 94.048 0 0 1 32 889.664V480.128c0-27.456 11.968-53.472 32.8-71.36L440.512 86.816a93.44 93.44 0 0 1 122.272 0l375.712 322.016a93.888 93.888 0 0 1 32.768 71.328v409.536a94.016 94.016 0 0 1-93.92 93.92z"  /></svg>;
const RecordIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
// BellIconをHeartIconに変更

const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;

// 塗りつぶしアイコン
const HomeIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>;
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