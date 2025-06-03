
'use server';
/**
 * @fileOverview A Genkit flow for Mr.M to answer questions about projects.
 *
 * - projectQnaFlow - Handles user questions about projects.
 * - ProjectQnaInput - Input schema for the flow.
 * - ProjectQnaOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getProjects } from '@/services/projectsService';
import type { Project } from '@/data/projects';

// Zod schema for Project data structure (subset for AI)
const ProjectZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  longDescription: z.string().optional(),
  categories: z.array(z.string()),
  technologies: z.array(z.string()),
  liveLink: z.string().url().optional().or(z.literal('')),
  sourceLink: z.string().url().optional().or(z.literal('')),
  documentationLink: z.string().url().optional().or(z.literal('')),
});
export type ProjectZod = z.infer<typeof ProjectZodSchema>;


const ProjectQnaInputSchema = z.object({
  question: z.string().describe('The user\'s question about the projects.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({
      text: z.string().optional(),
    }))
  })).optional().describe('Previous conversation history, if any.')
});
export type ProjectQnaInput = z.infer<typeof ProjectQnaInputSchema>;

const ProjectQnaOutputSchema = z.object({
  answer: z.string().describe('Mr.M\'s answer to the user\'s question.'),
});
export type ProjectQnaOutput = z.infer<typeof ProjectQnaOutputSchema>;

// Genkit Tool to fetch project data
const getProjectsTool = ai.defineTool(
  {
    name: 'getProjectsTool',
    description: "Fetches a list of Mytreyan's projects, including their titles, descriptions, technologies used, categories, and available links (live, source code, documentation). Use this tool to answer questions about specific projects or to get an overview of all projects.",
    inputSchema: z.object({}), // No specific input needed to fetch all projects for now
    outputSchema: z.array(ProjectZodSchema),
  },
  async () => {
    console.log('Mr.M: getProjectsTool invoked');
    const projects = await getProjects(); // Fetches all projects from Firestore
    // Map to ProjectZod schema, ensuring all required fields are present
    return projects.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        longDescription: p.longDescription,
        categories: p.categories,
        technologies: p.technologies,
        liveLink: p.liveLink || '', // ensure undefined is empty string
        sourceLink: p.sourceLink || '',
        documentationLink: p.documentationLink || '',
        // Fields like imageUrl, model, dataAiHint are not directly used by the LLM for Q&A here
        // but could be added if the prompt was designed to talk about visuals.
    }));
  }
);

const projectQnaPrompt = ai.definePrompt({
  name: 'projectQnaPrompt',
  input: { schema: ProjectQnaInputSchema },
  output: { schema: ProjectQnaOutputSchema },
  tools: [getProjectsTool],
  prompt: `You are Mr.M, a friendly and helpful AI assistant for Mytreyan's portfolio.
Your primary goal is to answer questions about Mytreyan's projects.
Use the 'getProjectsTool' to fetch information about the projects if you need it.
Base your answers STRICTLY on the information retrieved from the tool.
If the project information does not contain an answer to the user's question, clearly state that you don't have that specific information.
Do not invent or infer details not present in the project data.
Keep your answers concise and directly related to the projects.
Be polite and maintain a conversational tone.

Available projects data structure:
- id: string (unique identifier)
- title: string (project title)
- description: string (short summary)
- longDescription: string (optional, more detailed explanation)
- categories: array of strings (e.g., "Web Development", "3D Graphics")
- technologies: array of strings (e.g., "React", "Next.js", "Three.js")
- liveLink: string (optional URL to live demo)
- sourceLink: string (optional URL to source code)
- documentationLink: string (optional URL to documentation)

If the user asks a general greeting or a question not related to projects, you can respond politely but steer the conversation back to projects if appropriate, or state that you can only help with project-related questions.

Chat History (if any):
{{#if chatHistory}}
{{#each chatHistory}}
{{this.role}}: {{this.parts.0.text}}
{{/each}}
{{/if}}

User's current question: {{{question}}}
Mr.M's answer:
`,
});

const projectQnaFlow = ai.defineFlow(
  {
    name: 'projectQnaFlow',
    inputSchema: ProjectQnaInputSchema,
    outputSchema: ProjectQnaOutputSchema,
  },
  async (input) => {
    console.log('Mr.M: projectQnaFlow invoked with question:', input.question);
    const { output } = await projectQnaPrompt(input);

    if (!output || !output.answer) {
      console.error('Mr.M: Failed to get an answer from the prompt.');
      return { answer: "I'm sorry, I encountered a problem while trying to answer. Please try again." };
    }
    console.log('Mr.M: Generated answer:', output.answer);
    return output;
  }
);

export async function askMrM(input: ProjectQnaInput): Promise<ProjectQnaOutput> {
  return projectQnaFlow(input);
}
