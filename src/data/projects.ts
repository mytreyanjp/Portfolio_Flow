
export type Project = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  model?: string; // For self-hosted .glb files
  cloonedOID?: string; // For Clooned embeds
  dataAiHint: string;
  categories: string[];
  technologies: string[];
  liveLink?: string;
  sourceLink?: string;
  documentationLink?: string;
  videoLink?: string;
};

// This list can serve as initial/default categories or suggestions
export const initialCategories: Readonly<string[]> = ['Web Development', '3D Graphics', 'AI Integration', 'Mobile App', 'Game Development', 'Data Science', 'Uncategorized'];

export const allTechnologies: string[] = ['React', 'Next.js', 'Three.js', 'TypeScript', 'Node.js', 'Python', 'Genkit AI', 'Tailwind CSS', 'Firebase', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JavaScript', 'Google Gemini'];
