import { useState, useCallback } from 'react';
import { isMuted, setMuted } from '../utils/sounds';

export default function MuteButton({ className = '' }) {
  const [muted, setMutedState] = useState(() => isMuted());

  const toggle = useCallback(() => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }, [muted]);

  return (
    <button
      type="button"
      className={`btn btn-small btn-mute ${className}`}
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? '음소거 해제' : '음소거'}
      title={muted ? '소리 켜기' : '소리 끄기'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
