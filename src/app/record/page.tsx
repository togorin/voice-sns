'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>(''); // 録音フォーマットを保持

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // --- モバイル対応のための修正 ---
      // ブラウザが対応している音声フォーマットを自動で選択
      const supportedMimeTypes = ['audio/mp4', 'audio/webm'];
      const supportedType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!supportedType) {
        alert('Audio recording is not supported on your browser.');
        return;
      }
      mimeTypeRef.current = supportedType;
      // --- 修正ここまで ---

      const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const newAudioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        setAudioBlob(newAudioBlob);
        setAudioUrl(URL.createObjectURL(newAudioBlob));
        audioChunksRef.current = [];
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null);
      setAudioBlob(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access the microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePost = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsUploading(false);
      return;
    }
    
    // ファイルの拡張子を動的に設定
    const fileExt = mimeTypeRef.current.split('/')[1];
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('voice-memos').upload(fileName, audioBlob);
    if (uploadError) {
      setIsUploading(false);
      alert('Error uploading file: ' + uploadError.message);
      return;
    }
    const { data: urlData } = supabase.storage.from('voice-memos').getPublicUrl(fileName);
    const { error: insertError } = await supabase.from('posts').insert({ user_id: user.id, audio_url: urlData.publicUrl });
    setIsUploading(false);
    if (insertError) {
      alert('Error saving post: ' + insertError.message);
    } else {
      alert('Voice memo posted successfully!');
      router.push('/home');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <Link href="/home" className="absolute top-4 left-4 text-blue-400 hover:underline">
        &larr; Back to Timeline
      </Link>
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-white">Post a Voice Memo</h1>
        <div className="my-8">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="rounded-full bg-[#5151EB] px-8 py-8 text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
              disabled={isUploading}
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="rounded-full bg-red-600 px-8 py-8 text-white shadow-lg"
            >
              Stop Recording
            </button>
          )}
        </div>
        {audioUrl && (
          <div className="space-y-4">
            <p className="text-gray-300">Recording Complete!</p>
            <audio src={audioUrl} controls className="w-full" />
            <button
              onClick={handlePost}
              className="w-full rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Post this voice memo'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
