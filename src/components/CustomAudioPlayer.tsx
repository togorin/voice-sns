'use client';

import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

type CustomAudioPlayerProps = {
  src: string;
  onPlay: () => void;
};

export default function CustomAudioPlayer({ src, onPlay }: CustomAudioPlayerProps) {
  return (
    <>
      <style jsx global>{`
        .rhap_container {
          background-color: #1f2937; // bg-gray-800
          box-shadow: none;
          padding: 10px 15px;
        }
        .rhap_time, .rhap_current-time, .rhap_total-time {
          color: #d1d5db; // text-gray-300
        }
        .rhap_progress-bar, .rhap_progress-indicator {
          background-color: #4b5563; // bg-gray-600
        }
        .rhap_progress-filled {
          background-color: #ffffff; // bg-white
        }
        .rhap_volume-bar, .rhap_volume-indicator {
           background-color: #ffffff; // bg-white
        }
        .rhap_play-pause-button {
          color: #ffffff; // text-white
          font-size: 36px;
        }
        .rhap_volume-button {
          color: #ffffff; // text-white
        }
        .rhap_additional-controls, .rhap_rewind-button, .rhap_forward-button {
            display: none; // 不要なコントロールを非表示
        }
        .rhap_main-controls {
            margin: 0 10px;
        }
      `}</style>
      <AudioPlayer
        src={src}
        onPlay={onPlay}
        showJumpControls={false}
        customAdditionalControls={[]}
        customVolumeControls={[]}
        layout="stacked-reverse"
      />
    </>
  );
}
