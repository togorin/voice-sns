'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          {/* font-parkinsansをfont-unboundedに変更し、太さを調整 */}
          <h1 className="font-unbounded text-7xl font-bold text-white">stew</h1>
        </div>
        <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
          <div className="space-y-4">
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
                className="w-full rounded-md bg-[#5151EB] px-4 py-2 font-semibold text-white hover:bg-[#4141d4]"
              >
                Login
              </button>
            ) : (
              <button
                onClick={handleSignUp}
                className="w-full rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
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
      </div>
    </main>
  );
}
