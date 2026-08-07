import successSound from '../success.wav';

const audio = new Audio(successSound);
audio.preload = 'auto';

let unlocked = false;

// Browsers block audio.play() until the page has received a user gesture.
// Call this once on the first click/touch to "unlock" playback so later
// programmatic play() calls (triggered by websocket events) succeed reliably.
export const unlockAudio = () => {
  if (unlocked) return;
  audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      unlocked = true;
    })
    .catch(() => {});
};

export const playNotificationSound = () => {
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch((err) => console.error('Sound play failed:', err));
};
