
'use server';

import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { ResumeData, Skill, EducationEntry, WorkExperienceEntry, AwardEntry } from '@/data/resumeData';
import { DEFAULT_RESUME_DATA } from '@/data/resumeData';

const RESUME_COLLECTION_NAME = 'resumeContent';
const RESUME_DOC_ID = 'mainProfile';

function ensureId<T extends { id?: string }>(item: T, index: number): T & { id: string } {
  return {
    ...item,
    id: item.id || `item-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
  };
}


export async function getResumeData(): Promise<ResumeData> {
  try {
    const resumeDocRef = doc(db, RESUME_COLLECTION_NAME, RESUME_DOC_ID);
    const docSnap = await getDoc(resumeDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      const skills = (data.skillsList || DEFAULT_RESUME_DATA.skills).map((skill: any, index: number) => ensureId({
        name: skill.name || 'Unnamed Skill',
        level: typeof skill.level === 'number' ? skill.level : 0,
      }, index));

      const education = (data.educationList || DEFAULT_RESUME_DATA.education).map((edu: any, index: number) => ensureId({
        degree: edu.degree || '',
        institution: edu.institution || '',
        dates: edu.dates || '',
        description: edu.description || '',
      }, index));
      
      const experience = (data.experienceList || DEFAULT_RESUME_DATA.experience).map((exp: any, index: number) => ensureId({
        jobTitle: exp.jobTitle || '',
        company: exp.company || '',
        dates: exp.dates || '',
        responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
      }, index));

      const awards = (data.awardsList || DEFAULT_RESUME_DATA.awards).map((award: any, index: number) => ensureId({
        title: award.title || '',
        issuer: award.issuer || '',
        date: award.date || '',
        url: award.url || '',
      }, index));
      
      return {
        summaryItems: data.summaryItems || DEFAULT_RESUME_DATA.summaryItems,
        skills: skills,
        education: education,
        experience: experience,
        awards: awards,
        instagramUrl: data.instagramUrl || DEFAULT_RESUME_DATA.instagramUrl,
        githubUrl: data.githubUrl || DEFAULT_RESUME_DATA.githubUrl,
        linkedinUrl: data.linkedinUrl || DEFAULT_RESUME_DATA.linkedinUrl,
      };
    } else {
      console.log(`Resume document ${RESUME_DOC_ID} not found. Creating with default data.`);
      const defaultDataToSave = {
        summaryItems: DEFAULT_RESUME_DATA.summaryItems,
        skillsList: DEFAULT_RESUME_DATA.skills.map(({id, ...rest}) => rest), // Remove temp IDs
        educationList: DEFAULT_RESUME_DATA.education.map(({id, ...rest}) => rest),
        experienceList: DEFAULT_RESUME_DATA.experience.map(({id, ...rest}) => rest),
        awardsList: DEFAULT_RESUME_DATA.awards.map(({id, ...rest}) => rest),
        instagramUrl: DEFAULT_RESUME_DATA.instagramUrl,
        githubUrl: DEFAULT_RESUME_DATA.githubUrl,
        linkedinUrl: DEFAULT_RESUME_DATA.linkedinUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(resumeDocRef, defaultDataToSave);
      // Return with client-side IDs for consistency
      return {
        ...DEFAULT_RESUME_DATA,
         skills: DEFAULT_RESUME_DATA.skills.map((s, i) => ensureId(s, i)),
         education: DEFAULT_RESUME_DATA.education.map((e,i) => ensureId(e,i)),
         experience: DEFAULT_RESUME_DATA.experience.map((e,i) => ensureId(e,i)),
         awards: DEFAULT_RESUME_DATA.awards.map((a,i) => ensureId(a,i)),
      };
    }
  } catch (error) {
    console.error("Error fetching resume data: ", error);
    console.warn("Falling back to default resume data due to fetch error.");
    return {
      ...DEFAULT_RESUME_DATA,
      skills: DEFAULT_RESUME_DATA.skills.map((s, i) => ensureId(s, i)),
      education: DEFAULT_RESUME_DATA.education.map((e,i) => ensureId(e,i)),
      experience: DEFAULT_RESUME_DATA.experience.map((e,i) => ensureId(e,i)),
      awards: DEFAULT_RESUME_DATA.awards.map((a,i) => ensureId(a,i)),
    };
  }
}

export async function updateResumeData(data: Partial<ResumeData>): Promise<void> {
  try {
    const resumeDocRef = doc(db, RESUME_COLLECTION_NAME, RESUME_DOC_ID);
    const updatePayload: any = { updatedAt: serverTimestamp() };

    if (data.summaryItems) updatePayload.summaryItems = data.summaryItems;
    if (data.skills) updatePayload.skillsList = data.skills.map(({ id, ...rest }) => rest); // Store without client ID
    if (data.education) updatePayload.educationList = data.education.map(({ id, ...rest }) => rest);
    if (data.experience) updatePayload.experienceList = data.experience.map(({ id, ...rest }) => rest);
    if (data.awards) updatePayload.awardsList = data.awards.map(({ id, ...rest }) => rest);
    
    if (data.instagramUrl !== undefined) updatePayload.instagramUrl = data.instagramUrl;
    if (data.githubUrl !== undefined) updatePayload.githubUrl = data.githubUrl;
    if (data.linkedinUrl !== undefined) updatePayload.linkedinUrl = data.linkedinUrl;
    
    const docSnap = await getDoc(resumeDocRef);
    if (docSnap.exists()) {
        await updateDoc(resumeDocRef, updatePayload);
    } else {
        const fullData = {
          summaryItems: data.summaryItems || DEFAULT_RESUME_DATA.summaryItems,
          skillsList: data.skills ? data.skills.map(({id, ...rest}) => rest) : DEFAULT_RESUME_DATA.skills.map(({id, ...rest}) => rest),
          educationList: data.education ? data.education.map(({id, ...rest}) => rest) : DEFAULT_RESUME_DATA.education.map(({id, ...rest}) => rest),
          experienceList: data.experience ? data.experience.map(({id, ...rest}) => rest) : DEFAULT_RESUME_DATA.experience.map(({id, ...rest}) => rest),
          awardsList: data.awards ? data.awards.map(({id, ...rest}) => rest) : DEFAULT_RESUME_DATA.awards.map(({id, ...rest}) => rest),
          instagramUrl: data.instagramUrl !== undefined ? data.instagramUrl : DEFAULT_RESUME_DATA.instagramUrl,
          githubUrl: data.githubUrl !== undefined ? data.githubUrl : DEFAULT_RESUME_DATA.githubUrl,
          linkedinUrl: data.linkedinUrl !== undefined ? data.linkedinUrl : DEFAULT_RESUME_DATA.linkedinUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(resumeDocRef, fullData);
    }
    console.log("Resume data updated successfully.");
  } catch (error) {
    console.error("Error updating resume data: ", error);
    throw new Error(`Failed to update resume data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
