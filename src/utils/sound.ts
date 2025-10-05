/**
 * Plays a sound file from the public/audios directory
 * @param filename - The name of the sound file (without extension)
 * @param volume - Volume level between 0 and 1 (default: 1)
 * @returns The audio element being played
 */
export function playSound(filename: string, volume: number = 1): HTMLAudioElement {
  const audio = new Audio(`/audios/${filename}.mp3`);
  audio.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0-1
  audio.play().catch((err: Error) => {
    console.error(`Failed to play sound: ${filename}`, err);
  });
  return audio;
}

// Usage examples:
// playSound('abc');                  // Play at full volume
// playSound('abc', 0.5);             // Play at 50% volume
// const audio = playSound('abc');    // Get reference to control playback
// audio.pause();                     // Pause the sound
// audio.currentTime = 0;             // Reset to start