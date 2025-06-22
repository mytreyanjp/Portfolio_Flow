
'use server';

import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Project } from '@/data/projects';
import { initialCategories } from '@/data/projects';

const defaultProject: Project = {
  id: 'default-project-1',
  title: 'Sample Project: Interactive Model',
  description: 'This placeholder project showcases an interactive 3D model display.',
  longDescription: 'This sample project demonstrates how 3D models can be displayed in project cards. It includes a title, description, model URL, categories, and technologies. You can replace this with your actual projects from the Firestore database. This model is a simple wooden crate.',
  imageUrl: 'https://placehold.co/600x400.png',
  model: '/models/wooden_crate.glb',
  // cloonedOID: undefined, // No default Clooned OID
  dataAiHint: '3d crate',
  categories: ['3D Graphics', 'Sample'], 
  technologies: ['Three.js', 'React'],
  liveLink: '#',
  sourceLink: '#',
  documentationLink: '#',
  videoLink: undefined,
};

export async function getProjects(): Promise<Project[]> {
  try {
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection, orderBy('title'));

    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      let projectCategories: string[] = [];
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        projectCategories = data.categories.map((cat: any) => String(cat).trim()).filter(Boolean);
      } else if (typeof data.category === 'string' && data.category.trim() !== '') { 
        projectCategories = [data.category.trim()];
      }
      if (projectCategories.length === 0) {
        projectCategories = ['Uncategorized'];
      }

      projects.push({
        id: doc.id,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        longDescription: data.longDescription || data.description || '',
        imageUrl: data.imageUrl,
        model: data.model,
        cloonedOID: data.cloonedOID, // Add cloonedOID
        dataAiHint: data.dataAiHint || 'project image',
        categories: projectCategories, 
        technologies: data.technologies || [],
        liveLink: data.liveLink,
        sourceLink: data.sourceLink,
        documentationLink: data.documentationLink,
        videoLink: data.videoLink,
      });
    });

    if (projects.length === 0) {
      console.log("No projects found in Firestore, adding default project.");
      projects.push(defaultProject);
    }

    return projects.map(p => ({
      ...p,
      // Fallback image if no specific image, no model, and no clooned OID.
      // If cloonedOID is present, imageUrl might not be primary.
      imageUrl: p.imageUrl || (!p.model && !p.cloonedOID ? 'https://placehold.co/600x400.png' : undefined),
    }));

  } catch (error) {
    console.error("Error fetching projects: ", error);
    console.warn("Falling back to default project due to fetch error.");
    return [{
      ...defaultProject,
      imageUrl: defaultProject.imageUrl || (!defaultProject.model && !defaultProject.cloonedOID ? 'https://placehold.co/600x400.png' : undefined),
    }];
  }
}

export async function getUniqueCategoriesFromProjects(): Promise<string[]> {
  try {
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection);
    const querySnapshot = await getDocs(q);
    const categoriesFromDbProjects = new Set<string>();

    if (querySnapshot.empty) {
      console.log("No projects in Firestore, so no existing categories to suggest for AddProjectForm.");
      return [];
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.categories)) {
        data.categories.forEach((cat: any) => {
          if (typeof cat === 'string' && cat.trim() !== '') {
            categoriesFromDbProjects.add(cat.trim());
          }
        });
      } else if (typeof data.category === 'string' && data.category.trim() !== '') {
        categoriesFromDbProjects.add(data.category.trim());
      }
    });
    
    return Array.from(categoriesFromDbProjects).sort((a, b) => a.localeCompare(b));

  } catch (error) {
    console.error("Error fetching unique categories from projects: ", error);
    return [];
  }
}
