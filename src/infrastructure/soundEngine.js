/**
 * src/infrastructure/soundEngine.js
 * Capa de Infraestructura: Adaptador acústico Web Audio API para sistemas oficiales
 * World Archery (Danage DOM, Chronotir Klaxon, WA Arena TV, Silbato DOS y Audio Personalizado).
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Infrastructure = window.AimTimer.Infrastructure || {};

(function (Infrastructure) {
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.compressor = null;
      this.volume = 1.0;
      this.profile = 'danage'; // 'danage' | 'chronotir' | 'wa_arena' | 'whistle' | 'custom'
      this.customBuffer = null;
      this.activeTimeouts = [];
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-10, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(16, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.001, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.08, this.ctx.currentTime);
        this.compressor.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    clearScheduled() {
      this.activeTimeouts.forEach((id) => clearTimeout(id));
      this.activeTimeouts = [];
    }

    async loadCustomAudioFile(file) {
      this.init();
      const arrayBuffer = await file.arrayBuffer();
      this.customBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    }

    getKlaxonSaturationCurve() {
      const samples = 4096;
      const curve = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = Math.tanh(x * 3.8);
      }
      return curve;
    }

    /**
     * Reproduce un pulso individual con el timbre oficial de los equipos homologados por World Archery:
     * - 'danage': Buzzer piezoeléctrico industrial Danage DOM (850 Hz plano, seco, sin acordes musicales)
     * - 'chronotir': Bocina electromecánica Klaxon de campo Chronotir (doble membrana 345Hz + 415Hz)
     * - 'wa_arena': Tono electrónico limpio de 1000 Hz usado en finales de Copa del Mundo / TV
     * - 'whistle': Silbato oficial de Juez Director of Shooting (2850 Hz con modulación de bolilla 54 Hz)
     * - 'custom': Archivo de audio cargado por el usuario (.wav / .mp3)
     */
    playSingleTone(durationSec = 0.46, typeOverride = null) {
      this.init();
      const now = this.ctx.currentTime;
      const mode = typeOverride || this.profile;

      if (mode === 'custom' && this.customBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.customBuffer;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(Math.max(0.08, this.volume * 1.25), now);
        src.connect(g);
        g.connect(this.compressor);
        src.start(now);
        src.stop(now + Math.min(this.customBuffer.duration, durationSec + 0.35));
        return;
      }

      const masterGain = this.ctx.createGain();
      const peakGain = Math.max(0.08, this.volume * 1.25);
      // Ataque y corte ultra rápido de relé electrónico (< 4ms)
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(peakGain, now + 0.004);
      masterGain.gain.setValueAtTime(peakGain, now + Math.max(0.02, durationSec - 0.008));
      masterGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);
      masterGain.connect(this.compressor);

      if (mode === 'danage') {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2350, now);
        filter.Q.setValueAtTime(2.2, now);
        filter.connect(masterGain);

        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(850, now);
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + durationSec + 0.01);
      } else if (mode === 'chronotir') {
        const shaper = this.ctx.createWaveShaper();
        shaper.curve = this.getKlaxonSaturationCurve();

        const hornFormant = this.ctx.createBiquadFilter();
        hornFormant.type = 'bandpass';
        hornFormant.frequency.setValueAtTime(1120, now);
        hornFormant.Q.setValueAtTime(1.1, now);

        shaper.connect(hornFormant);
        hornFormant.connect(masterGain);

        [345, 415].forEach((freq) => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(shaper);
          osc.start(now);
          osc.stop(now + durationSec + 0.01);
        });
      } else if (mode === 'whistle') {
        const modOsc = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        modOsc.type = 'sine';
        modOsc.frequency.setValueAtTime(54, now);
        modGain.gain.setValueAtTime(65, now);
        modOsc.connect(modGain);
        modOsc.start(now);
        modOsc.stop(now + durationSec + 0.01);

        [2850, 2960].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          modGain.connect(osc.frequency);
          g.gain.setValueAtTime(idx === 0 ? 0.7 : 0.45, now);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(now);
          osc.stop(now + durationSec + 0.01);
        });
      } else {
        // 'wa_arena' — 1000 Hz limpio de finales TV
        const oscMain = this.ctx.createOscillator();
        const oscHarm = this.ctx.createOscillator();
        const harmGain = this.ctx.createGain();

        oscMain.type = 'sine';
        oscMain.frequency.setValueAtTime(1000, now);

        oscHarm.type = 'triangle';
        oscHarm.frequency.setValueAtTime(2000, now);
        harmGain.gain.setValueAtTime(0.22, now);

        oscMain.connect(masterGain);
        oscHarm.connect(harmGain);
        harmGain.connect(masterGain);

        oscMain.start(now);
        oscHarm.start(now);
        oscMain.stop(now + durationSec + 0.01);
        oscHarm.stop(now + durationSec + 0.01);
      }
    }

    /**
     * Señal oficial World Archery (Cadencia Danage / Chronotir):
     * - 1 pitido  = Iniciar tiro / Abrir arco
     * - 2 pitidos = Preparación / Llamado a línea / Cambio a descanso
     * - 3 pitidos = Fin de tanda / Tiempo agotado
     */
    playWASignal(beepsCount, onVisualNotify, customDurationMs = null) {
      this.clearScheduled();
      const beepDurationMs = customDurationMs || (beepsCount >= 3 ? 420 : 480);
      const beepGapMs = 210;

      if (onVisualNotify) {
        const label = beepsCount === 1 ? '🔊 1 PITIDO WA' : `🔊 ${beepsCount} PITIDOS WA`;
        onVisualNotify(label, beepsCount * (beepDurationMs + beepGapMs) + 350);
      }

      for (let i = 0; i < beepsCount; i++) {
        const delay = i * (beepDurationMs + beepGapMs);
        const tid = setTimeout(() => {
          this.playSingleTone(beepDurationMs / 1000);
        }, delay);
        this.activeTimeouts.push(tid);
      }
    }

    playLetDownRestSignal(onVisualNotify) {
      this.playWASignal(2, onVisualNotify, 260);
    }

    playCountdownPip() {
      this.playSingleTone(0.085);
    }
  }

  Infrastructure.SoundEngine = SoundEngine;
})(window.AimTimer.Infrastructure);

