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
  post_id: string | null;
  type: 'like' | 'comment' | 'follow';
  profiles: Profile | null; // 通知を送った人のプロフィール
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchAndReadNotifications = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      // 1. ログインユーザー宛の通知を取得
      const { data, error } = await supabase
        .from('notifications')
        .select(`*, profiles!notifications_notifier_id_fkey (username, avatar_url)`)
        .eq('notified_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data as Notification[]);
      }
      setLoading(false);

      // 2. ページを開いたら、すべての未読通知を既読にする
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('notified_id', user.id)
        .eq('is_read', false);
    };

    fetchAndReadNotifications();
  }, []);

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'follow') {
      return `/profile/${notification.notifier_id}`;
    }
    return `/post/${notification.post_id}`;
  };

  return (
    <main className="min-h-dvh bg-gray-900 pb-24">
      <div className="mx-auto max-w-md">
        {loading ? (
          <p className="p-4 text-center text-gray-400">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="p-4 text-center text-gray-400">No new notifications.</p>
        ) : (
          <div className="space-y-2 p-2">
            {notifications.map((notification) => (
              <Link href={getNotificationLink(notification)} key={notification.id}>
                <div className="flex items-center gap-3 rounded-lg bg-gray-800 p-4 shadow-lg transition-colors hover:bg-gray-700">
                  <img
                    src={notification.profiles?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${notification.profiles?.username || '?'}`}
                    alt="Avatar"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <p className="text-sm text-gray-200">
                    <span className="font-semibold">{notification.profiles?.username || 'Someone'}</span>
                    {notification.type === 'like' && ' liked your post.'}
                    {notification.type === 'comment' && ' commented on your post.'}
                    {notification.type === 'follow' && ' started following you.'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
