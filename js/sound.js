/* ==========================================================================
   SOUND & AUDIO FX ENGINE
   Pure Web Audio API synthesizer (no external audio files required)
   Plus Web Speech API integration for native English pronunciation
   ========================================================================== */

const SoundFX = {
  ctx: null,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Soft tap click
  playTap() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio not supported', e);
    }
  },

  // Duolingo-style signature double-tone correct chime ("Ding-Ding!")
  playCorrect() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Note 1 (E5 - 659Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, t);
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.3, t + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.16);

      // Note 2 (A5 - 880Hz, cheerful resolution)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, t + 0.12);
      gain2.gain.setValueAtTime(0, t + 0.12);
      gain2.gain.linearRampToValueAtTime(0.35, t + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.12);
      osc2.stop(t + 0.46);
    } catch (e) {
      console.warn('Audio error', e);
    }
  },

  // Soft low incorrect buzzer
  playIncorrect() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.25);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {
      console.warn('Audio error', e);
    }
  },

  // Gem / Diamond sparkle sound
  playGem() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [1046, 1318, 1567, 2093].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        gain.gain.setValueAtTime(0.2, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.13);
      });
    } catch (e) {}
  },

  // Level Complete fanfare
  playVictory() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.50, d: 0.35 } // C6
      ];
      let offset = 0;
      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t + offset);
        gain.gain.setValueAtTime(0.3, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, t + offset + n.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + n.d);
        offset += n.d * 0.85;
      });
    } catch (e) {}
  },

  // Speech pronunciation for English phrases
  speakEnglish(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Remove emojis and markdown asterisks
      const cleanText = text.replace(/[*_#~`]/g, '').replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      if (!cleanText) return;

      // Check if text has English quote or phrases
      const englishMatch = cleanText.match(/[«"']([a-zA-Z\s!?,.'-]+)[»"']/);
      const utterance = new SpeechSynthesisUtterance(englishMatch ? englishMatch[1].trim() : cleanText);
      utterance.lang = englishMatch ? 'en-US' : (/[a-zA-Z]{3,}/.test(cleanText) ? 'en-US' : 'ru-RU');
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error', e);
    }
  }
};
