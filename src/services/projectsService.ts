
'use server';

import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; // Removed doc, getDoc as they are not used here.
import type { Project } from '@/data/projects';
import { initialCategories } from '@/data/projects';

const defaultProject: Project = {
  id: 'default-project-1',
  title: 'Sample Project: Interactive Model',
  description: 'This placeholder project showcases an interactive 3D model display.',
  longDescription: 'This sample project demonstrates how 3D models can be displayed in project cards. It includes a title, description, model URL, category, and technologies. You can replace this with your actual projects from the Firestore database. This model is a simple wooden crate.',
  imageUrl: 'https://placehold.co/600x400.png', 
  model: '/models/wooden_crate.glb',
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
        longDescription: data.longDescription || data.description || '',
        imageUrl: data.imageUrl,
        model: data.model, 
        dataAiHint: data.dataAiHint || 'project image',
        category: data.category || 'Web Development', // Ensure category is a string
        technologies: data.technologies || [],
        liveLink: data.liveLink,
        sourceLink: data.sourceLink,
      });
    });

    if (projects.length === 0) {
      console.log("No projects found in Firestore, adding default project.");
      projects.push(defaultProject);
    }

    return projects.map(p => ({
      ...p,
      imageUrl: p.imageUrl || (!p.model ? 'https://placehold.co/600x400.png' : undefined),
    }));

  } catch (error) {
    console.error("Error fetching projects: ", error);
    console.warn("Falling back to default project due to fetch error.");
    return [{
      ...defaultProject,
      imageUrl: defaultProject.imageUrl || (!defaultProject.model ? 'https://placehold.co/600x400.png' : undefined),
    }];
  }
}

export async function getUniqueCategoriesFromProjects(): Promise<string[]> {
  try {
    // Fetch projects without the default if other projects exist
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection);
    const querySnapshot = await getDocs(q);
    const fetchedProjects: Project[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedProjects.push({
            id: doc.id,
            title: data.title || 'Untitled Project',
            description: data.description || '',
            category: data.category || 'Web Development',
            technologies: data.technologies || [],
            dataAiHint: data.dataAiHint || 'project image',
        });
    });


    const categoriesFromProjects = new Set<string>();
    const projectsToConsider = fetchedProjects.length > 0 ? fetchedProjects : [defaultProject];

    projectsToConsider.forEach(project => {
      if (project.category && project.category.trim() !== '' && project.id !== 'default-project-1') { // Exclude default project category unless it's the only one
        categoriesFromProjects.add(project.category.trim());
      }
    });
     if (fetchedProjects.length === 0 && defaultProject.category) { // Add default category if no projects from DB
        categoriesFromProjects.add(defaultProject.category.trim());
    }


    // Merge with initial/default categories to ensure they are always available
    const allUniqueCategories = new Set([...initialCategories, ...Array.from(categoriesFromProjects)]);
    
    return Array.from(allUniqueCategories).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error fetching unique categories: ", error);
    // Fallback to initial categories in case of error
    return [...initialCategories].sort((a, b) => a.localeCompare(b));
  }
}
