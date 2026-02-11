
export const SFX = {
  WIPE: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c3523a4103.mp3', // Whoosh / Wipe
  PUNCH: 'https://cdn.pixabay.com/audio/2022/03/24/audio_b28e217088.mp3', // Heavy Impact
  CLICK: 'https://cdn.pixabay.com/audio/2022/03/24/audio_3d1e188164.mp3', // Sharp UI click
  ENERGY: 'https://cdn.pixabay.com/audio/2021/08/04/audio_e652a2228e.mp3', // Digital pulse/tick
  HEROIC: 'https://cdn.pixabay.com/audio/2021/08/09/audio_73223f6631.mp3', // Dramatic brass hit
};

class SoundManager {
  private static instance: SoundManager;
  private muted: boolean = false;
  private audioPool: Map<string, HTMLAudioElement> = new Map();

  private constructor() {
    if (typeof window !== 'undefined') {
      Object.values(SFX).forEach(url => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.audioPool.set(url, audio);
      });
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public play(url: string, volume: number = 0.5) {
    if (this.muted) return;
    const audio = this.audioPool.get(url);
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = volume;
      clone.play().catch(() => {
        // Silently catch autoplay block errors
      });
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted() {
    return this.muted;
  }
}

export const soundManager = SoundManager.getInstance();
