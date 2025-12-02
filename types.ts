
export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  SELECTING_STYLE = 'SELECTING_STYLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type StyleCategory = 'Professional' | 'Political' | 'Casual' | 'Formal Events' | 'Cultural' | 'Creative' | 'Group Photos' | 'Social Media Status' | 'Profile Poses';

export interface StyleOption {
  id: string;
  name: string;
  category: StyleCategory;
  description: string;
  promptModifier: string;
  iconName: string;
  colorFrom: string;
  colorTo: string;
  previewUrl: string;
  customBackground?: File;
  isPremium?: boolean; // New flag to designate paid styles
}

export interface GeneratedImage {
  url: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  userId: string;
  isPremium: boolean;
  email?: string;
  mobile?: string;
}
