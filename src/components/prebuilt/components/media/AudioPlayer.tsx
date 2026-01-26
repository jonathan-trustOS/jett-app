/**
 * AudioPlayer - Pre-built Audio Player Component
 * 
 * Features:
 * - Play/pause, progress bar
 * - Volume control
 * - Track info display
 * - Playlist support (optional)
 */

import { useState, useRef, useEffect } from 'react'

interface Track {
  id: string
  src: string
  title: string
  artist?: string
  cover?: string
}

interface AudioPlayerProps {
  tracks: Track[]
  autoPlay?: boolean
  showPlaylist?: boolean
  onTrackChange?: (track: Track, index: number) => void
}

const IconPlay = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const IconPause = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
)

const IconPrev = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const IconNext = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const IconVolume = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
)

const IconMusic = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
)

export default function AudioPlayer({ tracks, autoPlay = false, showPlaylist = false, onTrackChange }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)

  const currentTrack = tracks[currentIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => nextTrack()

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentIndex])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play(); setIsPlaying(true) }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Number(e.target.value)
  }

  const prevTrack = () => {
    const newIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
    onTrackChange?.(tracks[newIndex], newIndex)
    if (isPlaying) setTimeout(() => audioRef.current?.play(), 100)
  }

  const nextTrack = () => {
    const newIndex = currentIndex === tracks.length - 1 ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
    onTrackChange?.(tracks[newIndex], newIndex)
    if (isPlaying) setTimeout(() => audioRef.current?.play(), 100)
  }

  const selectTrack = (index: number) => {
    setCurrentIndex(index)
    onTrackChange?.(tracks[index], index)
    setIsPlaying(true)
    setTimeout(() => audioRef.current?.play(), 100)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      <audio ref={audioRef} src={currentTrack?.src} autoPlay={autoPlay} />
      
      {/* Main player */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          {/* Cover art */}
          <div className="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}>
            {currentTrack?.cover ? (
              <img src={currentTrack.cover} alt="" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <IconMusic />
            )}
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{currentTrack?.title || 'No track'}</h3>
            {currentTrack?.artist && <p className="text-sm truncate" style={{ color: 'var(--text-tertiary)' }}>{currentTrack.artist}</p>}
            
            {/* Progress */}
            <div className="mt-3">
              <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek} className="w-full h-1 appearance-none rounded-full cursor-pointer" style={{ background: 'var(--bg-primary)' }} />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <button onClick={prevTrack} className="p-2 hover:text-blue-400 transition-colors" style={{ color: 'var(--text-secondary)' }}><IconPrev /></button>
          <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors">
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button onClick={nextTrack} className="p-2 hover:text-blue-400 transition-colors" style={{ color: 'var(--text-secondary)' }}><IconNext /></button>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <IconVolume />
          <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-24 h-1 appearance-none rounded-full cursor-pointer" style={{ background: 'var(--bg-primary)' }} />
        </div>
      </div>

      {/* Playlist */}
      {showPlaylist && tracks.length > 1 && (
        <div className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="p-4 max-h-48 overflow-y-auto">
            {tracks.map((track, index) => (
              <div key={track.id} onClick={() => selectTrack(index)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${index === currentIndex ? 'bg-blue-600/20' : 'hover:bg-white/5'}`}>
                <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-primary)' }}>
                  {track.cover ? <img src={track.cover} alt="" className="w-full h-full object-cover rounded" /> : <IconMusic />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: index === currentIndex ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{track.title}</p>
                  {track.artist && <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{track.artist}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
