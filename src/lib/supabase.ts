import { createClient } from '@supabase/supabase-js'

// 環境変数からSupabaseのURLとanonキーを取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ユーザーの未読通知をすべて既読にする関数
export async function markAllAsRead(userId: string) {
  if (!userId) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true }) // is_readをtrueに更新
    .eq('notified_id', userId)   // ログインしているユーザーIDに一致
    .eq('is_read', false);     // 未読の通知のみを対象

  if (error) {
    console.error('Error marking notifications as read:', error);
  }
}