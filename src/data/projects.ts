
export type Project = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  model?: string;
  dataAiHint: string;
  categories: string[]; // Changed from category: string
  technologies: string[];
  liveLink?: string;
  sourceLink?: string;
  documentationLink?: string; // Added documentation link
};

// This list can serve as initial/default categories or suggestions
export const initialCategories: Readonly<string[]> = ['Web Development', '3D Graphics', 'AI Integration', 'Mobile App', 'Game Development', 'Data Science', 'Uncategorized'];

export const allTechnologies: string[] = ['React', 'Next.js', 'Three.js', 'TypeScript', 'Node.js', 'Python', 'Genkit AI', 'Tailwind CSS', 'Firebase', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JavaScript', 'Google Gemini'];

