
export type Project = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl: string; // Kept for potential fallback or other uses, but card will prioritize model
  modelUrl?: string; // New field for the 3D model path
  dataAiHint: string;
  category: 'Web Development' | '3D Graphics' | 'AI Integration' | 'Mobile App';
  technologies: string[];
  liveLink?: string;
  sourceLink?: string;
};

export const categories: Project['category'][] = ['Web Development', '3D Graphics', 'AI Integration', 'Mobile App'];

export const allTechnologies: string[] = ['React', 'Next.js', 'Three.js', 'TypeScript', 'Node.js', 'Python', 'Genkit AI', 'Tailwind CSS', 'Firebase', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JavaScript', 'Google Gemini'];
