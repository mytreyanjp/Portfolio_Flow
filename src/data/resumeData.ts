
export interface Skill {
  id?: string; // Optional, can be used for React keys if managing in UI
  name: string;
  level: number;
}

export interface ResumeData {
  summaryItems: string[];
  skills: Skill[];
}

export const DEFAULT_RESUME_DATA: ResumeData = {
  summaryItems: [
    "IT student skilled in web dev, data structures, C++, Java, Python, JavaScript.",
    "Proficient in Machine Learning, 3D Modeling (Blender/Unity), SQL.",
    "Practical experience in 3D design, video/image editing, and hardware.",
    "Proactive leader, eager for challenges and driving innovative solutions.",
  ],
  skills: [
    { name: 'Web Development (React/Next.js)', level: 90 },
    { name: 'JavaScript & Python', level: 85 },
    { name: 'Data Structures & Algorithms', level: 85 },
    { name: 'C/C++ & Java', level: 75 },
    { name: 'SQL & Databases', level: 80 },
    { name: '3D Modeling (Blender, Unity)', level: 85 },
    { name: 'Machine Learning Concepts', level: 70 },
    { name: 'Video/Image Editing', level: 70 },
    { name: 'Computer Hardware Basics', level: 65 },
    { name: 'Leadership & Problem Solving', level: 90 },
  ],
};
