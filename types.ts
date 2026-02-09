
export enum ComicStyle {
  MODERN_DC = "Modern Superhero (DC/Marvel Style)",
  MANGA = "Classic Manga (Black & White)",
  NOIR = "Detective Noir (High Contrast)",
  WATERCOLOR = "Artistic Watercolor Graphic Novel",
  POP_ART = "Vintage Pop Art (Lichtenstein Style)",
  RETRO_90S = "Retro 90s Saturday Morning Cartoon"
}

export enum QualityMode {
  FAST = "FAST",
  STUDIO = "STUDIO",
  ULTRA = "ULTRA"
}

export interface ComicPanelData {
  id: string;
  description: string;
  dialogue?: string;
  characterExpression?: string;
  onomatopoeia?: string;
  imageUrl?: string;
  generating?: boolean;
  isCover?: boolean;
}

export type AppView = 'landing' | 'onboarding' | 'auth' | 'dashboard' | 'billing';
export type DashboardStep = 'source' | 'style' | 'quality' | 'summary' | 'loading' | 'result';

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  credits: number;
  subscription: 'Free' | 'Starter' | 'Pro' | 'Studio';
  surveyData?: Record<string, string>;
}

export interface ComicState {
  view: AppView;
  user: User | null;
  videoFile: File | null;
  videoPreviewUrl: string | null;
  youtubeUrl: string | null;
  youtubeThumb?: string | null;
  videoDuration: number; // in seconds
  quality: QualityMode;
  style: ComicStyle | null;
  panels: ComicPanelData[];
  status: 'idle' | 'analyzing' | 'generating_panels' | 'completed' | 'error';
  error: string | null;
}
