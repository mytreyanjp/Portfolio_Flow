
export type Project = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl: string;
  model?: string; // Renamed from modelUrl
  dataAiHint: string;
  category: 'Web Development' | '3D Graphics' | 'AI Integration' | 'Mobile App';
  technologies: string[];
  liveLink?: string;
  sourceLink?: string;
};

export const categories: Project['category'][] = ['Web Development', '3D Graphics', 'AI Integration', 'Mobile App'];

export const allTechnologies: string[] = ['React', 'Next.js', 'Three.js', 'TypeScript', 'Node.js', 'Python', 'Genkit AI', 'Tailwind CSS', 'Firebase', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JavaScript', 'Google Gemini'];
