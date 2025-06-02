
'use server';

import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { ResumeData, Skill } from '@/data/resumeData';
import { DEFAULT_RESUME_DATA } from '@/data/resumeData';

const RESUME_COLLECTION_NAME = 'resumeContent';
const RESUME_DOC_ID = 'mainProfile';

export async function getResumeData(): Promise<ResumeData> {
  try {
    const resumeDocRef = doc(db, RESUME_COLLECTION_NAME, RESUME_DOC_ID);
    const docSnap = await getDoc(resumeDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure skills have at least name and level, provide defaults if not.
      const skills = (data.skillsList || DEFAULT_RESUME_DATA.skills).map((skill: any) => ({
        name: skill.name || 'Unnamed Skill',
        level: typeof skill.level === 'number' ? skill.level : 0,
        id: skill.id || Math.random().toString(36).substring(7) // Ensure an id for key prop
      }));
      return {
        summaryItems: data.summaryItems || DEFAULT_RESUME_DATA.summaryItems,
        skills: skills,
      };
    } else {
      // Document doesn't exist, create it with default data
      console.log(`Resume document ${RESUME_DOC_ID} not found. Creating with default data.`);
      await setDoc(resumeDocRef, { 
        ...DEFAULT_RESUME_DATA, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return DEFAULT_RESUME_DATA;
    }
  } catch (error) {
    console.error("Error fetching resume data: ", error);
    console.warn("Falling back to default resume data due to fetch error.");
    // Return default data with IDs for skills for consistent UI rendering
    return {
      ...DEFAULT_RESUME_DATA,
      skills: DEFAULT_RESUME_DATA.skills.map(skill => ({
        ...skill,
        id: Math.random().toString(36).substring(7)
      }))
    };
  }
}

export async function updateResumeData(data: Partial<ResumeData>): Promise<void> {
  try {
    const resumeDocRef = doc(db, RESUME_COLLECTION_NAME, RESUME_DOC_ID);
    const updatePayload: any = {};

    if (data.summaryItems) {
      updatePayload.summaryItems = data.summaryItems;
    }
    if (data.skills) {
      // Ensure skills only contain name and level for Firestore storage
      updatePayload.skillsList = data.skills.map(skill => ({
        name: skill.name,
        level: skill.level,
      }));
    }
    updatePayload.updatedAt = serverTimestamp();
    
    const docSnap = await getDoc(resumeDocRef);
    if (docSnap.exists()) {
        await updateDoc(resumeDocRef, updatePayload);
    } else {
        await setDoc(resumeDocRef, { ...DEFAULT_RESUME_DATA, ...updatePayload, createdAt: serverTimestamp() });
    }
    console.log("Resume data updated successfully.");
  } catch (error) {
    console.error("Error updating resume data: ", error);
    throw new Error(`Failed to update resume data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
