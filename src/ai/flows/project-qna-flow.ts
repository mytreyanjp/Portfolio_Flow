
'use server';
/**
 * @fileOverview A Genkit flow for Mr.M to answer questions about a specific selected project,
 * and provide general information related to the project's domain.
 *
 * - askMrMAboutProject - Handles user questions about a specific project or its domain.
 * - ProjectQnaInput - Input schema for the flow.
 * - ProjectQnaOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Project } from '@/data/projects';

// Zod schema for Project data structure (subset for AI)
// This schema defines what project details the AI will receive.
const ProjectZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  longDescription: z.string().optional().describe("A more detailed explanation of the project."),
  categories: z.array(z.string()).describe("List of categories the project belongs to. These indicate the project's domain."),
  technologies: z.array(z.string()).describe("List of technologies used in the project."),
  liveLink: z.string().url().optional().or(z.literal('')).describe("Link to the live demo, if available."),
  sourceLink: z.string().url().optional().or(z.literal('')).describe("Link to the source code, if available."),
  documentationLink: z.string().url().optional().or(z.literal('')).describe("Link to the documentation, if available."),
});
export type ProjectZod = z.infer<typeof ProjectZodSchema>;


const ProjectQnaInputSchema = z.object({
  question: z.string().describe("The user's question about the selected project or its domain."),
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
  answer: z.string().describe("Mr.M's answer to the user's question."),
});
export type ProjectQnaOutput = z.infer<typeof ProjectQnaOutputSchema>;

const projectQnaPrompt = ai.definePrompt({
  name: 'projectQnaContextualPrompt',
  input: { schema: ProjectQnaInputSchema },
  output: { schema: ProjectQnaOutputSchema },
  prompt: `You are Mr.M, a friendly and helpful AI assistant for Mytreyan's portfolio.
Your current task is to answer questions about ONE SPECIFIC project, based on the details provided below, AND to provide general information related to the project's domain if asked.

Project Details:
Title: {{{projectContext.title}}}
Description: {{{projectContext.description}}}
{{#if projectContext.longDescription}}
Long Description: {{{projectContext.longDescription}}}
{{/if}}
Categories: {{#each projectContext.categories}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}} (These categories, like "{{projectContext.categories.0}}", indicate the project's domain)
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
1.  **For questions directly about the project "{{projectContext.title}}"** (e.g., "What was the main challenge in this project?", "What specific features does '{{projectContext.title}}' have?"):
    *   Base your answers PRIMARILY on the "Project Details" provided above for "{{projectContext.title}}".
    *   If the project information doesn't contain the answer, clearly state that you don't have that specific information for *this particular project*.
    *   Do NOT invent details about the project "{{projectContext.title}}" itself that aren't provided in its details.
2.  **For general questions related to the project's domain or technologies** (e.g., if the project is in 'Machine Learning', questions like "What are common machine learning algorithms?" or "Tell me about {{{projectContext.technologies.0}}}"):
    *   You MAY use your general knowledge to provide helpful, informative answers.
    *   If possible, try to subtly link your general answer back to the project's context if it feels natural (e.g., "In general, X is used for Y. This project, '{{projectContext.title}}', uses Z, which relates to X by...").
    *   If the question is ambiguous (e.g., "Tell me about challenges"), clarify if the user means challenges *in this specific project* or challenges *in the {{projectContext.categories.0}} domain generally*.
3.  **General Conduct**:
    *   Keep your answers concise and directly related to the project "{{projectContext.title}}" or its domain.
    *   Be polite and maintain a conversational tone.
    *   Do NOT answer questions about other projects or make comparisons unless specifically asked and the information for comparison is explicitly available in the current project's context (which is unlikely in this focused mode).

Previous chat about "{{projectContext.title}}" (if any):
{{#if chatHistory}}
{{#each chatHistory}}
{{this.role}}: {{this.parts.0.text}}
{{/each}}
{{/if}}

User's current question (it could be about "{{projectContext.title}}" specifically, or about its domain like {{projectContext.categories.0}}): {{{question}}}
Mr.M's answer:
`,
});

const projectQnaFlow = ai.defineFlow(
  {
    name: 'projectQnaContextualFlow',
    inputSchema: ProjectQnaInputSchema,
    outputSchema: ProjectQnaOutputSchema,
  },
  async (input) => {
    console.log('Mr.M: projectQnaContextualFlow invoked for project:', input.projectContext.title, 'Question:', input.question);
    const { output } = await projectQnaPrompt(input);

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
