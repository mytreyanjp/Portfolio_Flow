export type Project = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl: string;
  dataAiHint: string;
  category: 'Web Development' | '3D Graphics' | 'AI Integration' | 'Mobile App';
  technologies: string[];
  liveLink?: string;
  sourceLink?: string;
};

export const categories: Project['category'][] = ['Web Development', '3D Graphics', 'AI Integration', 'Mobile App'];

export const allTechnologies: string[] = ['React', 'Next.js', 'Three.js', 'TypeScript', 'Node.js', 'Python', 'Genkit AI', 'Tailwind CSS', 'Firebase', 'Swift', 'Kotlin'];

export const projectsData: Project[] = [
  {
    id: '1',
    title: 'Interactive Product Visualizer',
    description: 'A 3D product visualizer allowing users to customize and view products in real-time.',
    longDescription: 'This project features an advanced 3D rendering engine built with Three.js and Next.js. Users can interact with product models, change colors, materials, and see live updates. It includes a sophisticated UI for customization options and is optimized for performance across devices.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'product 3d',
    category: '3D Graphics',
    technologies: ['Three.js', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    liveLink: '#',
    sourceLink: '#',
  },
  {
    id: '2',
    title: 'AI-Powered Content Generator',
    description: 'A web application that uses AI to generate creative content based on user prompts.',
    longDescription: 'Leveraging Genkit AI and Google\'s Gemini models, this application provides a suite of tools for content creation, including text generation, summarization, and idea brainstorming. The backend is built with Node.js and integrates seamlessly with the AI services.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'ai writing',
    category: 'AI Integration',
    technologies: ['Genkit AI', 'Next.js', 'Node.js', 'TypeScript', 'Google Gemini'],
    liveLink: '#',
  },
  {
    id: '3',
    title: 'E-commerce Platform',
    description: 'A full-stack e-commerce platform with features like product listings, cart, and checkout.',
    longDescription: 'A robust e-commerce solution built with React and Next.js for the frontend, and Firebase for backend services including authentication, database, and storage. It provides a seamless shopping experience with a modern user interface.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'ecommerce website',
    category: 'Web Development',
    technologies: ['React', 'Next.js', 'Firebase', 'Tailwind CSS'],
    sourceLink: '#',
  },
  {
    id: '4',
    title: 'Mobile Fitness Tracker',
    description: 'A cross-platform mobile application for tracking fitness activities and progress.',
    longDescription: 'This mobile app, developed for both iOS and Android, helps users monitor their workouts, set goals, and view detailed analytics. It features real-time GPS tracking, social sharing, and personalized training plans.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'fitness app',
    category: 'Mobile App',
    technologies: ['Swift', 'Kotlin', 'Firebase', 'React Native'],
  },
  {
    id: '5',
    title: 'Portfolio Website V1',
    description: 'My previous portfolio website, showcasing earlier projects and skills.',
    longDescription: 'An earlier iteration of my personal portfolio, built with vanilla JavaScript and custom CSS. It served as a foundational project for learning web development principles and design.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'portfolio old',
    category: 'Web Development',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    liveLink: '#',
  },
];
