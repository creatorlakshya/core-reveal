class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false; // Muted by default per Section 9

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private noise(ctx: AudioContext, seconds: number, decay: number): AudioBufferSourceNode {
    const size = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    return src;
  }

  // Blade whoosh + metallic shing + low thump; pitch climbs with each slice
  public playPackSlice(step: number) {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const pitch = 1 + step * 0.12;

      const whoosh = this.noise(ctx, 0.25, 0.08);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(2500 * pitch, now);
      hp.frequency.exponentialRampToValueAtTime(9000, now + 0.14);
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(0.0001, now);
      wg.gain.linearRampToValueAtTime(0.09, now + 0.03);
      wg.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      whoosh.connect(hp);
      hp.connect(wg);
      wg.connect(ctx.destination);
      whoosh.start(now);
      whoosh.stop(now + 0.25);

      [2400, 3610].forEach((f) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f * pitch, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(f * pitch * 0.8, now + 0.4);
        g.gain.setValueAtTime(0.0001, now + 0.05);
        g.gain.linearRampToValueAtTime(0.015, now + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + 0.05);
        osc.stop(now + 0.42);
      });

      const thump = ctx.createOscillator();
      const tg = ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(160, now + 0.05);
      thump.frequency.exponentialRampToValueAtTime(48, now + 0.28);
      tg.gain.setValueAtTime(0.0001, now + 0.05);
      tg.gain.linearRampToValueAtTime(0.08, now + 0.07);
      tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      thump.connect(tg);
      tg.connect(ctx.destination);
      thump.start(now + 0.05);
      thump.stop(now + 0.32);
    } catch {
      // Audio fail-safe
    }
  }

  // Boom + debris hiss + rising chime as the cards pop out
  public playPackBurst() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const boom = ctx.createOscillator();
      const bg = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(110, now);
      boom.frequency.exponentialRampToValueAtTime(34, now + 0.6);
      bg.gain.setValueAtTime(0.0001, now);
      bg.gain.linearRampToValueAtTime(0.3, now + 0.02);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      boom.connect(bg);
      bg.connect(ctx.destination);
      boom.start(now);
      boom.stop(now + 0.72);

      const hiss = this.noise(ctx, 0.6, 0.18);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(3000, now);
      bp.frequency.exponentialRampToValueAtTime(900, now + 0.5);
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(0.18, now);
      hg.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      hiss.connect(bp);
      bp.connect(hg);
      hg.connect(ctx.destination);
      hiss.start(now);
      hiss.stop(now + 0.6);

      [392.0, 523.25, 659.25, 783.99].forEach((f, i) => {
        const t = now + 0.12 + i * 0.07;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.05, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1.3);
      });
    } catch {
      // Audio fail-safe
    }
  }

  public playCardDraw() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const noise = this.noise(ctx, 0.22, 0.1);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.2);
      filter.Q.setValueAtTime(2.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.23);
    } catch {
      // Audio fail-safe
    }
  }

  public playCardFlip() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.24);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio fail-safe
    }
  }

  public playRevealStinger() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [311.13, 392.00, 466.16];

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);

        const startTime = now + i * 0.03;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.04, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.1);
      });
    } catch {
      // Audio fail-safe
    }
  }

  public playFinaleChime() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const scale = [261.63, 329.63, 392.00, 523.25];
      scale.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        const startTime = now + idx * 0.06;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.04, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.9);
      });
    } catch {
      // Audio fail-safe
    }
  }
}

export const sound = new SoundEngine();
