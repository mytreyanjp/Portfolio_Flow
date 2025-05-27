
'use server';

import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Project } from '@/data/projects';

const defaultProject: Project = {
  id: 'default-project-1',
  title: 'Sample Project: My Awesome App',
  description: 'This is a placeholder project to showcase the portfolio functionality.',
  longDescription: 'This sample project demonstrates how projects are displayed in the portfolio. It includes a title, description, image, category, and technologies. You can replace this with your actual projects from the Firestore database. This long description provides more details about what the project might entail, perhaps its goals, challenges, and outcomes.',
  imageUrl: 'https://placehold.co/600x400.png',
  dataAiHint: 'app interface',
  category: 'Web Development',
  technologies: ['React', 'Next.js', 'Tailwind CSS'],
  liveLink: '#', // Placeholder link, consider making it non-clickable or removing if not applicable
  sourceLink: '#', // Placeholder link
};

export async function getProjects(): Promise<Project[]> {
  try {
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection, orderBy('title')); 

    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        longDescription: data.longDescription || '',
        imageUrl: data.imageUrl || 'https://placehold.co/600x400.png',
        dataAiHint: data.dataAiHint || 'project image',
        category: data.category || 'Web Development',
        technologies: data.technologies || [],
        liveLink: data.liveLink,
        sourceLink: data.sourceLink,
      });
    });

    // If no projects are fetched from Firestore, add the default project
    if (projects.length === 0) {
      console.log("No projects found in Firestore, adding default project.");
      projects.push(defaultProject);
    }

    return projects;
  } catch (error) {
    console.error("Error fetching projects: ", error);
    // If fetching fails, also return the default project as a fallback
    console.warn("Falling back to default project due to fetch error.");
    return [defaultProject];
  }
}
