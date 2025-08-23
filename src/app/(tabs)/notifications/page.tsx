'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

// 型定義
type Profile = { username: string; avatar_url: string | null; };
type Notification = {
  id: string;
  created_at: string;
  notifier_id: string;
  notified_id: string;
  post_id: string | null;
  type: 'like' | 'comment' | 'follow';
  is_read: boolean;
  profiles: Profile | null; // 通知を送った人のプロフィール
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      // ログインユーザー宛の通知を取得
      const { data, error } = await supabase
        .from('notifications')
        .select(`*, profiles (username, avatar_url)`)
        .eq('notified_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data as Notification[]);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  return (
    <main className="min-h-dvh bg-gray-900 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <h1 className="font-unbounded text-center text-l font-bold text-white">Notifications</h1>
      </header>

      <div className="mx-auto max-w-md p-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-400">No new notifications.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-lg bg-gray-800 p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${notification.notifier_id}`}>
                    <img
                      src={notification.profiles?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${notification.profiles?.username || '?'}`}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </Link>
                  <p className="text-sm text-gray-200">
                    <Link href={`/profile/${notification.notifier_id}`} className="font-semibold hover:underline">
                      {notification.profiles?.username || 'Unknown User'}
                    </Link>
                    {notification.type === 'like' && ' liked your post.'}
                    {notification.type === 'comment' && ' commented on your post.'}
                    {notification.type === 'follow' && ' started following you.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}