'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!username) {
      alert('Please enter a username.');
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: { data: { username: username } },
    });
    if (error) {
      alert('Error signing up: ' + error.message);
    } else {
      alert('Sign up successful! Please log in.');
      setIsLoginView(true);
    }
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      alert('Error: ' + error.message);
    } else {
      router.push('/home');
    }
  };

  // Googleログインの処理
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error with Google login:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
            <h1 className="font-unbounded text-6xl font-bold text-white">stew</h1>
          {/* キャッチコピーを追加 */}
          <p className="mt-2 text-lg text-gray-400">Speak your mind.</p>
        </div>
        <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
          <div className="space-y-4">
            {/* Googleログインボタン */}
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-600 bg-white px-4 py-2 font-medium text-gray-800 hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.111-11.181-7.463l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.971,36.213,44,30.601,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
              Sign in with Google
            </button>
            <div className="my-4 flex items-center">
              <div className="flex-grow border-t border-gray-600"></div>
              <span className="mx-4 flex-shrink text-sm text-gray-400">Or continue with</span>
              <div className="flex-grow border-t border-gray-600"></div>
            </div>
            {!isLoginView && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div className="space-y-3 pt-6">
            {isLoginView ? (
              <button
                onClick={handleLogin}
                className="w-full rounded-md bg-[#D3FE3E] px-4 py-2 font-semibold text-black hover:bg-[#c2ef25]"
              >
                Login
              </button>
            ) : (
              <button
                onClick={handleSignUp}
                className="w-full rounded-md bg-[#D3FE3E] px-4 py-2 font-semibold text-black hover:bg-[#c2ef25]"
              >
                Sign Up
              </button>
            )}
          </div>
          <div className="pt-6 text-center text-sm">
            <span className="text-gray-400">
              {isLoginView
                ? "Don't have an account?"
                : 'Already have an account?'}
            </span>
            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className="ml-2 font-semibold text-blue-400 hover:underline"
            >
              {isLoginView ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </div>
        <div className="text-center">
          <Link href="/home" className="text-sm font-bold text-gray-400 underline underline-offset-4 hover:text-gray-200">
            or browse the timeline as a guest
          </Link>
        </div>
      </div>
    </main>
  );
}
