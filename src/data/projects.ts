
export type Project = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  model?: string;
  dataAiHint: string;
  category: string; // Changed from enum to string
  technologies: string[];
  liveLink?: string;
  sourceLink?: string;
};

// This list can serve as initial/default categories
export const initialCategories: Readonly<string[]> = ['Web Development', '3D Graphics', 'AI Integration', 'Mobile App', 'Game Development', 'Data Science'];

export const allTechnologies: string[] = ['React', 'Next.js', 'Three.js', 'TypeScript', 'Node.js', 'Python', 'Genkit AI', 'Tailwind CSS', 'Firebase', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JavaScript', 'Google Gemini'];
