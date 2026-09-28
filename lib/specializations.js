import { Palette, Monitor, Film, Mic, Video, Camera } from 'lucide-react';

export const SPECIALIZATIONS = [
  {
    key: 'traditional_arts',
    label: 'Traditional Arts',
    Icon: Palette,
    description: 'Drawing, painting, illustration, and mixed-media craft.',
    tags: ['Sketching', 'Painting', 'Mixed Media'],
    accent: '#DC2626',
  },
  {
    key: 'digital_arts',
    label: 'Digital Arts',
    Icon: Monitor,
    description: 'Digital illustration, concept art, and visual design.',
    tags: ['Procreate', 'Photoshop', 'Illustrator'],
    accent: '#F59E0B',
  },
  {
    key: 'animation',
    label: 'Animation',
    Icon: Film,
    description: '2D/3D animation, motion graphics, and VFX.',
    tags: ['After Effects', 'Blender', 'Premiere'],
    accent: '#991B1B',
  },
  {
    key: 'voice_acting',
    label: 'Voice Acting',
    Icon: Mic,
    description: 'Character performance, narration, and voiceover work.',
    tags: ['Character Voice', 'Narration', 'Dubbing'],
    accent: '#7F1D1D',
  },
  {
    key: 'videography',
    label: 'Videography',
    Icon: Video,
    description: 'Filming, shooting, and cinematography for short-form media.',
    tags: ['Cinematography', 'Lighting', 'Editing'],
    accent: '#B91C1C',
  },
  {
    key: 'photography',
    label: 'Photography',
    Icon: Camera,
    description: 'Portraiture, editorial, and event photography.',
    tags: ['Portrait', 'Editorial', 'Events'],
    accent: '#DC2626',
  },
];
