
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
  dataAiHint: '3d crate',
  categories: ['3D Graphics', 'Sample'], 
  technologies: ['Three.js', 'React'],
  liveLink: '#',
  sourceLink: '#',
  documentationLink: '#', // Added placeholder documentation link
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
        dataAiHint: data.dataAiHint || 'project image',
        categories: projectCategories, 
        technologies: data.technologies || [],
        liveLink: data.liveLink,
        sourceLink: data.sourceLink,
        documentationLink: data.documentationLink, // Added documentation link
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
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection);
    const querySnapshot = await getDocs(q);
    const fetchedProjectsData: any[] = [];
    querySnapshot.forEach((doc) => fetchedProjectsData.push(doc.data()));

    const categoriesFromProjects = new Set<string>();
    const projectsDataToConsider = fetchedProjectsData.length > 0 ? fetchedProjectsData : [defaultProject];

    projectsDataToConsider.forEach(data => {
      if (Array.isArray(data.categories)) {
        data.categories.forEach((cat: any) => {
          if (typeof cat === 'string' && cat.trim() !== '') {
            categoriesFromProjects.add(cat.trim());
          }
        });
      } else if (typeof data.category === 'string' && data.category.trim() !== '') { 
         categoriesFromProjects.add(data.category.trim());
      }
    });
    
    if (fetchedProjectsData.length === 0 && defaultProject.categories) {
       defaultProject.categories.forEach(cat => categoriesFromProjects.add(cat.trim()));
    }

    const allUniqueCategories = new Set([...initialCategories, ...Array.from(categoriesFromProjects)]);
    
    return Array.from(allUniqueCategories).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error fetching unique categories: ", error);
    return [...initialCategories].sort((a, b) => a.localeCompare(b));
  }
}
