let unlocked = false;

// Mobile/desktop browsers require a user gesture before speechSynthesis
// will produce audible output. Call this once on the first click/touch.
export const unlockSpeech = () => {
  if (unlocked || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    unlocked = true;
  } catch {
    // ignore — speech synthesis unsupported
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
