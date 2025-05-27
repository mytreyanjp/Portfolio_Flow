
'use server';

import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Project } from '@/data/projects';

const defaultProject: Project = {
  id: 'default-project-1',
  title: 'Sample Project: Interactive Model',
  description: 'This placeholder project showcases an interactive 3D model display.',
  longDescription: 'This sample project demonstrates how 3D models can be displayed in project cards. It includes a title, description, model URL, category, and technologies. You can replace this with your actual projects from the Firestore database. This model is a simple wooden crate.',
  imageUrl: 'https://placehold.co/600x400.png', // Fallback image
  model: '/models/wooden_crate.glb', // Path to a default/placeholder GLB model, renamed from modelUrl
  dataAiHint: '3d crate',
  category: '3D Graphics',
  technologies: ['Three.js', 'React'],
  liveLink: '#',
  sourceLink: '#',
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
        model: data.model, // Fetch model, renamed from modelUrl
        dataAiHint: data.dataAiHint || 'project image',
        category: data.category || 'Web Development',
        technologies: data.technologies || [],
        liveLink: data.liveLink,
        sourceLink: data.sourceLink,
      });
    });

    if (projects.length === 0) {
      console.log("No projects found in Firestore, adding default project.");
      projects.push(defaultProject);
    }

    return projects;
  } catch (error) {
    console.error("Error fetching projects: ", error);
    console.warn("Falling back to default project due to fetch error.");
    return [defaultProject];
  }
}
