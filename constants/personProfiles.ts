import type { PersonId, UserRole } from '@/types/database';

export const FAMILY_ID = 'casa-zago';

export interface PersonProfile {
  id: PersonId; // == Firestore users/{id} doc id
  name: string;
  role: UserRole;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    hover: string; // pressed/active state for menu items on top of `primary`
  };
  image: number; // require() result — fallback when no Cloudinary photoUrl is set
}

export const PERSON_PROFILES: Record<PersonId, PersonProfile> = {
  guilherme: {
    id: 'guilherme',
    name: 'Guilherme',
    role: 'admin',
    colors: { primary: '#000000', secondary: '#FFFFFF', accent: '#FF0000', hover: '#262626' },
    image: require('../assets/images/guilherme.jpeg'),
  },
  amanda: {
    id: 'amanda',
    name: 'Amanda',
    role: 'member',
    colors: { primary: '#5A3E32', secondary: '#D4A574', accent: '#6B4423', hover: '#6B4423' },
    image: require('../assets/images/amanda.jpeg'),
  },
  renata: {
    id: 'renata',
    name: 'Renata',
    role: 'member',
    colors: { primary: '#050619', secondary: '#e64b78', accent: '#ff9ad0', hover: '#1a2552' },
    image: require('../assets/images/renata.jpeg'),
  },
  vander: {
    id: 'vander',
    name: 'Vander',
    role: 'member',
    colors: { primary: '#0a0e0c', secondary: '#1a4d3d', accent: '#7fd4c1', hover: '#1a4d3d' },
    image: require('../assets/images/vander.jpeg'),
  },
  emanuella: {
    id: 'emanuella',
    name: 'Emanuella',
    role: 'member',
    // Rosa Marie Cat (laço da Marie) — corrigido
    colors: { primary: '#E83E8C', secondary: '#FCE4EC', accent: '#F8BBD0', hover: '#C71A6C' },
    image: require('../assets/images/mariecat.png'), // placeholder until real photo is added
  },
  lucas: {
    id: 'lucas',
    name: 'Lucas',
    role: 'member',
    colors: { primary: '#000000', secondary: '#FFFFFF', accent: '#424242', hover: '#333333' },
    image: require('../assets/images/formula1.png'), // placeholder until real photo is added
  },
};

export const PERSON_ORDER: PersonId[] = ['guilherme', 'amanda', 'renata', 'vander', 'emanuella', 'lucas'];
