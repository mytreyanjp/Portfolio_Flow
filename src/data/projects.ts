
export type Project = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl: string;
  dataAiHint: string;
  category: 'Web Development' | '3D Graphics' | 'AI Integration' | 'Mobile App'; // Keep categories defined or fetch them too
  technologies: string[];
  liveLink?: string;
  sourceLink?: string;
};

// These can remain static or be fetched from Firestore if they need to be dynamic
export const categories: Project['category'][] = ['Web Development', '3D Graphics', 'AI Integration', 'Mobile App'];

export const allTechnologies: string[] = ['React', 'Next.js', 'Three.js', 'TypeScript', 'Node.js', 'Python', 'Genkit AI', 'Tailwind CSS', 'Firebase', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JavaScript', 'Google Gemini'];

// projectsData is now removed as projects will be fetched from Firestore.
// If you need example data for local development without Firestore, you can re-add it here
// or create a separate mock data file.
// export const projectsData: Project[] = [ ... ];
