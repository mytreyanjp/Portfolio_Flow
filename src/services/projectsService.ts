
'use server'; // Can be used by server components, but fetching will be client-side in page.tsx

import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Project } from '@/data/projects';

export async function getProjects(): Promise<Project[]> {
  try {
    const projectsCollection = collection(db, 'projects');
    // You can order by a specific field, e.g., a timestamp or title
    // For now, let's assume a 'createdAt' field or default ordering
    const q = query(projectsCollection, orderBy('title')); // Example: order by title

    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      // Ensure all fields from Project type are mapped, handling potential undefined values
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
    return projects;
  } catch (error) {
    console.error("Error fetching projects: ", error);
    // In a real app, you might want to throw the error or return a specific error object
    throw new Error('Failed to fetch projects.');
  }
}
