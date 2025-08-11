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
  const [title, setTitle] = useState('');
  const router = useRouter();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleStartRecording = async () => {
    try {
      // 1. マイクから音声ストリーム取得（自動ゲイン制御も有効化）
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          noiseSuppression: true,
          echoCancellation: true,
        }
      });

      // 2. Web Audio API でゲイン調整
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(rawStream);

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 2.5; // ★ 音量を約2.5倍に（調整可能）

      source.connect(gainNode);

      // 処理後のストリームを MediaRecorder 用に変換
      const destination = audioContextRef.current.createMediaStreamDestination();
      gainNode.connect(destination);
      const processedStream = destination.stream;

      // 3. 録音の MIME タイプ判定
      const supportedMimeTypes = ['audio/mp4', 'audio/webm'];
      const supportedType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!supportedType) {
        alert('Audio recording is not supported on your browser.');
        return;
      }
      mimeTypeRef.current = supportedType;

      // 4. MediaRecorder の設定
      const mediaRecorder = new MediaRecorder(processedStream, {
        mimeType: supportedType,
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const newAudioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        setAudioBlob(newAudioBlob);
        setAudioUrl(URL.createObjectURL(newAudioBlob));
        audioChunksRef.current = [];
        audioContextRef.current?.close();
      };

      // 5. 録音開始
      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null);
      setAudioBlob(null);
      setTitle('');

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
    
    const fileExt = mimeTypeRef.current.split('/')[1];
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('voice-memos').upload(fileName, audioBlob);
    if (uploadError) {
      setIsUploading(false);
      alert('Error uploading file: ' + uploadError.message);
      return;
    }
    const { data: urlData } = supabase.storage.from('voice-memos').getPublicUrl(fileName);
    
    const { error: insertError } = await supabase.from('posts').insert({ 
      user_id: user.id, 
      audio_url: urlData.publicUrl,
      title: title || null,
    });

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
      <Link href="/home" className="absolute top-5 left-5 text-2xl font-bold text-white hover:text-gray-300">
        &lt;
      </Link>
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 text-center shadow-lg">
        <h1 className="text-xl font-bold text-white">Post a Voice Memo</h1>
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
            <input
              type="text"
              placeholder="Add a title... (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={20}
              className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <audio 
              src={audioUrl} 
              controls 
              className="w-full" 
            />
            <button
              onClick={handlePost}
              className="w-full rounded-md bg-[#D3FE3E] px-4 py-3 font-semibold text-black hover:bg-[#c2ef25] disabled:bg-gray-400"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Post'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
