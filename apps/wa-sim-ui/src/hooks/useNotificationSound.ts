/**
 * Phase 2: Notification Sound
 * Play sound when receiving new messages
 */

import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Store for sound settings
interface SoundSettingsState {
  enabled: boolean
  volume: number
  setEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
}

export const useSoundSettings = create<SoundSettingsState>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.5,
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) => set({ volume })
    }),
    { name: 'wa-sim-sound-settings' }
  )
)

// WhatsApp-like notification sound (base64 encoded short beep)
// This is a simple tone - in production you'd use actual WhatsApp sounds
const NOTIFICATION_SOUND_DATA = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleUY4ZrDU06FrQyFDht3PsFshCE2J1+G2aTgmV6Pa47RiLA5Bgt3QsFogCU6K1+K2aTcmV6Pa47RiLA5Bgt3QsFogCU6K1+K2aTcmV6Pa47RiLA5Bgt3QsFogCU6K1+K2aTcmV6Pa47RiLA4='

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { enabled, volume } = useSoundSettings()

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(NOTIFICATION_SOUND_DATA)
    audioRef.current.volume = volume

    return () => {
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  function playSound() {
    if (enabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors
      })
    }
  }

  return { playSound }
}
