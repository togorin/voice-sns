'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.158 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0h-6" /></svg>;

export default function Header() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const session = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      session.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUnreadStatus = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('notified_id', currentUser.id)
        .eq('is_read', false);
      setHasUnread((count || 0) > 0);
    };
    fetchUnreadStatus();

    const channel = supabase.channel('notifications_check').on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `notified_id=eq.${currentUser.id}`
      },
      () => fetchUnreadStatus()
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
      <div className="w-1/3">
        {currentUser && (
          <Link href="/notifications" className="relative text-gray-400 hover:text-white">
            <BellIcon />
            {hasUnread && (
              <span className="absolute -right-1 -top-1 block h-3 w-3 rounded-full bg-red-500"></span>
            )}
          </Link>
        )}
      </div>
      <h1 className="font-unbounded w-1/3 text-center text-3xl font-bold text-white">stew</h1>
      <div className="flex w-1/3 justify-end">
        {loading ? <div className="h-8 w-20"></div> : 
         currentUser ? <button onClick={handleLogout} className="rounded-md bg-gray-700 px-4 py-1.5 text-sm font-semibold text-gray-200 hover:bg-gray-600">Logout</button> : 
         <Link href="/" className="rounded-md bg-[#D3FE3E] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#c2ef25]">Login</Link>}
      </div>
    </header>
  );
}
