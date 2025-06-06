
export interface Skill {
  id?: string; // Optional, can be used for React keys if managing in UI
  name: string;
  level: number;
}

export interface EducationEntry {
  id?: string;
  degree: string;
  institution: string;
  dates: string; // e.g., "2018 - 2022" or "Expected May 2025"
  description?: string;
}

export interface WorkExperienceEntry {
  id?: string;
  jobTitle: string;
  company: string;
  dates: string; // e.g., "Jan 2021 - Present"
  responsibilities: string[]; // Each string is a bullet point
}

export interface AwardEntry {
  id?: string;
  title: string;
  issuer?: string; // e.g., "Google", "Udemy", "Company Name"
  date?: string; // e.g., "2023" or "May 2022"
  url?: string; // Optional link to the certificate or award page
}

export interface ResumeData {
  summaryItems: string[];
  skills: Skill[];
  education: EducationEntry[];
  experience: WorkExperienceEntry[];
  awards: AwardEntry[];
  instagramUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  resumePdfUrl?: string; // Added resume PDF URL
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
  education: [
    {
      degree: "B.Tech Information Technology",
      institution: "College of Engineering Guindy, Anna University",
      dates: "2021 - Present",
      description: "Practicing various domains of information services and technologies.",
    },
  ],
  experience: [
    {
      jobTitle: "Placeholder Senior Developer",
      company: "Tech Solutions Inc.",
      dates: "Jan 2021 - Present",
      responsibilities: [
        "Led development of key features for a flagship product, improving performance by 20%.",
        "Mentored junior developers and contributed to best practices for code quality.",
        "Integrated Three.js for interactive 3D product demos on the company website.",
      ],
    },
    {
      jobTitle: "Placeholder Web Developer",
      company: "Creative Agency LLC",
      dates: "Jun 2018 - Dec 2020",
      responsibilities: [
        "Developed and maintained client websites using React and Node.js.",
        "Collaborated with designers to implement responsive and user-friendly interfaces.",
      ],
    },
  ],
  awards: [
    {
      title: "Placeholder Next.js Developer Certification",
      issuer: "Vercel Academy",
      date: "2023",
      url: "https://example.com/cert/nextjs",
    },
    {
      title: "Placeholder Innovation Award",
      issuer: "Tech Solutions Inc.",
      date: "2022",
    },
  ],
  instagramUrl: "https://www.instagram.com/mytreyn?igsh=YnZyanJmOTZwaW1l",
  githubUrl: "https://github.com/mytreyanjp",
  linkedinUrl: "https://www.linkedin.com/in/mytreyan-jp-49226a2a7/",
  resumePdfUrl: "https://example.com/placeholder-resume.pdf", // Added default placeholder
};

