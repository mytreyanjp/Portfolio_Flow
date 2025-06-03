
'use server';
/**
 * @fileOverview A Genkit flow for Mr.M to answer questions about a specific selected project,
 * and provide general information related to the project's domain or any other topic.
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
You are currently focused on Mytreyan's project: **"{{{projectContext.title}}}"**.

Project Details for "{{projectContext.title}}":
Title: {{{projectContext.title}}}
Description: {{{projectContext.description}}}
{{#if projectContext.longDescription}}
Long Description: {{{projectContext.longDescription}}}
{{/if}}
Categories: {{#if projectContext.categories.length}}{{#each projectContext.categories}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
Technologies Used: {{#if projectContext.technologies.length}}{{#each projectContext.technologies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
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
1.  **PRIORITY 1: Questions about "{{projectContext.title}}"**:
    *   If the user's question is directly about the project "{{projectContext.title}}" (e.g., "What was the main challenge in this project?", "What specific features does '{{projectContext.title}}' have?"), base your answers PRIMARILY on the "Project Details" provided above.
    *   If the project information doesn't contain the answer, clearly state that you don't have that specific information for *this particular project*.
    *   Do NOT invent details about "{{projectContext.title}}".

2.  **PRIORITY 2: Questions related to "{{projectContext.title}}"'s domain or technologies**:
    *   If the question is more general but related to the project's domain (e.g., questions about {{#if projectContext.categories.[0]}}"{{projectContext.categories.[0]}}"{{else}}the project's field{{/if}}) or technologies (e.g., "Tell me about {{#if projectContext.technologies.[0]}}{{{projectContext.technologies.[0]}}}{{else}}a technology used{{/if}}"), use your general knowledge to provide helpful, informative answers.
    *   If possible, try to subtly link your general answer back to the project's context if it feels natural.

3.  **PRIORITY 3: General Questions**:
    *   If the user's question is not covered by Priority 1 or 2 (i.e., it's a general knowledge question unrelated to "{{projectContext.title}}" or its immediate domain/tech):
        *   Answer it using your broad general knowledge as a helpful AI assistant.
        *   You don't need to force a connection back to "{{projectContext.title}}" for these questions.

4.  **General Conduct**:
    *   Be polite and maintain a conversational tone.
    *   Use the provided chat history for context.
    *   You are an AI assistant for Mytreyan's portfolio. While you can answer general questions, if a question is about other specific projects by Mytreyan not currently selected, politely suggest the user select that project from the list for focused information.

Previous chat about "{{projectContext.title}}" (if any):
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

