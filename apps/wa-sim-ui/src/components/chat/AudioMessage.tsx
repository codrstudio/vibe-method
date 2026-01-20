/**
 * Phase 2: Audio Message
 * Displays an audio message with play/pause and progress
 */

import { useState, useRef } from 'react'
import { Play, Pause, Mic } from 'lucide-react'

interface AudioMessageProps {
  duration: number // in seconds
  url?: string
  isOwn: boolean
}

export function AudioMessage({ duration, isOwn }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<number | null>(null)

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function handlePlayPause() {
    if (isPlaying) {
      // Pause
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    } else {
      // Play - simulate audio playback
      setIsPlaying(true)
      const startProgress = progress
      const startTime = Date.now()
      const remainingDuration = (1 - startProgress) * duration * 1000

      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime
        const newProgress = startProgress + (elapsed / (duration * 1000))

        if (newProgress >= 1) {
          setProgress(0)
          setIsPlaying(false)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        } else {
          setProgress(newProgress)
        }
      }, 100)

      // Auto-stop after duration
      setTimeout(() => {
        setIsPlaying(false)
        setProgress(0)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }, remainingDuration)
    }
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      {/* Play/Pause button */}
      <button
        onClick={handlePlayPause}
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isOwn
            ? 'bg-wa-green-dark text-white'
            : 'bg-wa-green-primary text-white'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* Waveform / Progress */}
      <div className="flex-1">
        <div className="relative h-2 bg-wa-bg-hover/50 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-wa-green-dark rounded-full transition-all"
            style={{ width: `${progress * 100}%` }}
          />
          {/* Fake waveform bars */}
          <div className="absolute inset-0 flex items-center justify-around px-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-wa-text-secondary/30 rounded-full"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-wa-text-secondary mt-1">
          {isPlaying ? formatDuration(duration * progress) : formatDuration(duration)}
        </p>
      </div>

      {/* Mic icon */}
      <Mic className="w-4 h-4 text-wa-text-secondary" />
    </div>
  )
}

/**
 * Audio Recording Button
 */
interface AudioRecorderProps {
  onRecorded: (duration: number) => void
}

export function AudioRecorder({ onRecorded }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const intervalRef = useRef<number | null>(null)

  function handleToggleRecording() {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (recordingTime > 0) {
        onRecorded(recordingTime)
      }
      setRecordingTime(0)
    } else {
      // Start recording
      setIsRecording(true)
      setRecordingTime(0)
      intervalRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <>
          <span className="w-2 h-2 bg-wa-text-danger rounded-full animate-pulse" />
          <span className="text-sm text-wa-text-secondary">{formatTime(recordingTime)}</span>
        </>
      )}
      <button
        onClick={handleToggleRecording}
        className={`p-2 rounded-full transition-colors ${
          isRecording
            ? 'bg-wa-text-danger text-white'
            : 'hover:bg-wa-bg-hover text-wa-text-secondary'
        }`}
        title={isRecording ? 'Parar gravacao' : 'Gravar audio'}
      >
        <Mic className="w-6 h-6" />
      </button>
    </div>
  )
}
