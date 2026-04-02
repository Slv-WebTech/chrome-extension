'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type PlayerMode = 'link' | 'local';

export function MusicPlayer() {
  const [mode, setMode] = useState<PlayerMode>('link');
  const [customUrl, setCustomUrl] = useState('');
  const [localTracks, setLocalTracks] = useState<Array<{ name: string; url: string }>>([]);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedLink = useMemo(() => {
    const trimmed = customUrl.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }, [customUrl]);

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openCustomUrl = () => {
    if (!normalizedLink) return;
    openLink(normalizedLink);
  };

  const handleLocalAudioPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Revoke old object URLs before replacing local track list.
    localTracks.forEach((track) => URL.revokeObjectURL(track.url));

    const tracks = Array.from(files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setLocalTracks(tracks);
    setSelectedTrackIndex(0);

    // Allow selecting the same files again in a future pick.
    event.target.value = '';
  };

  const pickLocalAudio = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    return () => {
      localTracks.forEach((track) => URL.revokeObjectURL(track.url));
    };
  }, [localTracks]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45 }}
      className="relative w-[252px] rounded-2xl border border-white/16 bg-white/12 p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-[1px] rounded-[15px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]" />

      <div className="relative z-10 mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.18em] text-white/92">MUSIC</h3>
        <span className="rounded-full bg-white/14 px-1.5 py-0.5 text-[9px] text-white/70">player</span>
      </div>

      <div className="relative z-10 mb-2 grid grid-cols-2 gap-1 rounded-lg bg-black/18 p-1">
        {(['link', 'local'] as PlayerMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide transition-all duration-200 ${
              mode === item
                ? 'bg-gradient-to-r from-emerald-300/34 to-cyan-300/28 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.26),0_4px_10px_rgba(45,212,191,0.22)]'
                : 'border border-white/10 bg-white/4 text-white/72 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            {item === 'link' ? 'By Link' : 'Local Library'}
          </button>
        ))}
      </div>

      {mode === 'link' ? (
        <>
          <label className="relative z-10 mb-1 block text-[10px] text-white/72">Playlist URL</label>
          <div className="relative z-10 flex gap-1">
            <input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste playlist link"
              className="w-full rounded-md border border-white/14 bg-black/22 px-2 py-1.5 text-[11px] text-white placeholder:text-white/38 outline-none"
            />
            <button
              type="button"
              onClick={openCustomUrl}
              disabled={!normalizedLink}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-200 ${
                normalizedLink
                  ? 'bg-gradient-to-r from-cyan-400/38 to-sky-400/28 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] hover:from-cyan-400/50 hover:to-sky-400/42'
                  : 'cursor-not-allowed border border-white/12 bg-white/8 text-white/45'
              }`}
            >
              Open
            </button>
          </div>
          <p className="relative z-10 mt-1.5 text-[9px] text-white/58">Use any music or playlist URL.</p>
        </>
      ) : (
        <>
          <label className="relative z-10 mb-1 block text-[10px] text-white/72">Pick local audio</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleLocalAudioPick}
            className="hidden"
          />
          <div className="relative z-10 mb-2 flex items-center gap-1.5 rounded-md border border-white/12 bg-black/20 p-1.5">
            <button
              type="button"
              onClick={pickLocalAudio}
              className="shrink-0 rounded-md border border-white/14 bg-white/14 px-2 py-1 text-[10px] font-semibold tracking-wide text-white transition-all duration-200 hover:border-white/24 hover:bg-white/24"
            >
              Choose
            </button>
            <p className="truncate text-[10px] text-white/75">
              {localTracks.length > 0 ? `${localTracks.length} files selected` : 'No file selected'}
            </p>
          </div>
          {localTracks.length > 0 && (
            <select
              value={selectedTrackIndex}
              onChange={(e) => setSelectedTrackIndex(Number(e.target.value))}
              className="relative z-10 mb-2 w-full rounded-md border border-white/14 bg-black/22 px-2 py-1.5 text-[11px] text-white outline-none"
            >
              {localTracks.map((track, index) => (
                <option key={track.url} value={index} className="bg-slate-800 text-white">
                  {track.name}
                </option>
              ))}
            </select>
          )}
          <div className="relative z-10 rounded-lg border border-white/12 bg-black/22 p-1.5">
            <audio className="w-full" controls src={localTracks[selectedTrackIndex]?.url ?? undefined} />
          </div>
        </>
      )}
    </motion.div>
  );
}
