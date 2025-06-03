
'use server';
/**
 * @fileOverview A Genkit flow for Mr.M to answer questions about a specific selected project.
 *
 * - askMrMAboutProject - Handles user questions about a specific project.
 * - ProjectQnaInput - Input schema for the flow.
 * - ProjectQnaOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Project } from '@/data/projects'; // Keep this for reference if needed by other parts, but ProjectZodSchema is primary for AI

// Zod schema for Project data structure (subset for AI)
// This schema defines what project details the AI will receive.
const ProjectZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  longDescription: z.string().optional().describe("A more detailed explanation of the project."),
  categories: z.array(z.string()).describe("List of categories the project belongs to."),
  technologies: z.array(z.string()).describe("List of technologies used in the project."),
  liveLink: z.string().url().optional().or(z.literal('')).describe("Link to the live demo, if available."),
  sourceLink: z.string().url().optional().or(z.literal('')).describe("Link to the source code, if available."),
  documentationLink: z.string().url().optional().or(z.literal('')).describe("Link to the documentation, if available."),
});
export type ProjectZod = z.infer<typeof ProjectZodSchema>;


const ProjectQnaInputSchema = z.object({
  question: z.string().describe("The user's question about the selected project."),
  projectContext: ProjectZodSchema.describe("The details of the project the user is asking about."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({
      text: z.string().optional(),
    }))
  })).optional().describe('Previous conversation history for this specific project session, if any.')
});
export type ProjectQnaInput = z.infer<typeof ProjectQnaInputSchema>;

const ProjectQnaOutputSchema = z.object({
  answer: z.string().describe("Mr.M's answer to the user's question about the specific project."),
});
export type ProjectQnaOutput = z.infer<typeof ProjectQnaOutputSchema>;

const projectQnaPrompt = ai.definePrompt({
  name: 'projectQnaContextualPrompt', // Renamed for clarity
  input: { schema: ProjectQnaInputSchema },
  output: { schema: ProjectQnaOutputSchema },
  // No tools needed here as project data is directly provided
  prompt: `You are Mr.M, a friendly and helpful AI assistant for Mytreyan's portfolio.
Your current task is to answer questions about ONE SPECIFIC project, based on the details provided below.

Project Details:
Title: {{{projectContext.title}}}
Description: {{{projectContext.description}}}
{{#if projectContext.longDescription}}
Long Description: {{{projectContext.longDescription}}}
{{/if}}
Categories: {{#each projectContext.categories}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Technologies Used: {{#each projectContext.technologies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{#if projectContext.liveLink}}
Live Demo Link: {{{projectContext.liveLink}}}
{{/if}}
{{#if projectContext.sourceLink}}
Source Code Link: {{{projectContext.sourceLink}}}
{{/if}}
{{#if projectContext.documentationLink}}
Documentation Link: {{{projectContext.documentationLink}}}
{{/if}}

Instructions for Mr.M:
- Base your answers STRICTLY on the information provided above for "{{projectContext.title}}".
- If the provided project information does not contain an answer to the user's question, clearly state that you don't have that specific information for *this* project.
- Do NOT invent or infer details not present in the provided project data.
- Do NOT answer questions about other projects or make comparisons unless specifically asked and you have that information (which you typically won't in this focused mode).
- Keep your answers concise and directly related to the project "{{projectContext.title}}".
- Be polite and maintain a conversational tone.

Previous chat about "{{projectContext.title}}" (if any):
{{#if chatHistory}}
{{#each chatHistory}}
{{this.role}}: {{this.parts.0.text}}
{{/each}}
{{/if}}

User's current question about "{{projectContext.title}}": {{{question}}}
Mr.M's answer:
`,
});

const projectQnaFlow = ai.defineFlow(
  {
    name: 'projectQnaContextualFlow', // Renamed
    inputSchema: ProjectQnaInputSchema,
    outputSchema: ProjectQnaOutputSchema,
  },
  async (input) => {
    console.log('Mr.M: projectQnaContextualFlow invoked for project:', input.projectContext.title, 'Question:', input.question);
    const { output } = await projectQnaPrompt(input); // Pass the whole input which includes projectContext

    if (!output || !output.answer) {
      console.error('Mr.M: Failed to get an answer from the contextual prompt.');
      return { answer: "I'm sorry, I encountered a problem while trying to answer. Please try again." };
    }
    console.log('Mr.M: Generated contextual answer:', output.answer);
    return output;
  }
);

// This is the function the frontend will call
export async function askMrMAboutProject(input: ProjectQnaInput): Promise<ProjectQnaOutput> {
  return projectQnaFlow(input);
}
