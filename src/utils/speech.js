let unlocked = false;

// Chrome has a long-standing bug where speechSynthesis silently goes dead
// after ~15s idle — very likely on this dashboard since it runs unattended
// on a screen for hours. Pausing+resuming periodically keeps it alive.
// https://bugs.chromium.org/p/chromium/issues/detail?id=679437
if (typeof window !== 'undefined' && window.speechSynthesis) {
  setInterval(() => {
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }, 10000);
}

// Mobile/desktop browsers require a user gesture before speechSynthesis
// will produce audible output. Call this once on the first click/touch.
export const unlockSpeech = () => {
  if (unlocked || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    unlocked = true;
  } catch (err) {
    console.error('Failed to unlock speech synthesis:', err);
  }
};

const getHindiVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(
    (v) => v.lang.includes('hi') || v.lang.includes('IN') || v.name.toLowerCase().includes('hindi')
  );
};

// Announces which employee scanned which order/style so the person
// watching the screen knows what just happened without reading it.
export const speakEmployeeUpdate = ({ employeeName, styleNumber, orderId }) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !styleNumber) return;

  window.speechSynthesis.cancel();
  // cancel() can leave the engine "paused" on some Chrome builds
  window.speechSynthesis.resume();

  const text = `कर्मचारी ${employeeName}, ऑर्डर ${orderId}, स्टाइल नंबर ${styleNumber}।`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  const hindiVoice = getHindiVoice();
  if (hindiVoice) utterance.voice = hindiVoice;

  utterance.onerror = (event) => console.error('Speech error:', event);

  window.speechSynthesis.speak(utterance);
};
