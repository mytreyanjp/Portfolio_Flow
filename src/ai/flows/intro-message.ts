// Intro message
'use server';

/**
 * @fileOverview AI-powered tool to generate personalized introductory messages for potential employers.
 *
 * - generateIntroMessage - A function that handles the intro message generation process.
 * - IntroMessageInput - The input type for the generateIntroMessage function.
 * - IntroMessageOutput - The return type for the generateIntroMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntroMessageInputSchema = z.object({
  employer: z.string().describe('The name of the potential employer.'),
  jobTitle: z.string().describe('The job title for which the introduction is being written.'),
  userSkills: z.array(z.string()).describe('The skills that the user possesses.'),
  userExperience: z.string().describe('A brief summary of the user\u2019s experience.'),
  desiredTone: z
    .enum(['formal', 'casual', 'enthusiastic'])
    .default('casual')
    .describe('The desired tone of the introductory message.'),
});

export type IntroMessageInput = z.infer<typeof IntroMessageInputSchema>;

const IntroMessageOutputSchema = z.object({
  introMessage: z.string().describe('The generated introductory message.'),
});

export type IntroMessageOutput = z.infer<typeof IntroMessageOutputSchema>;

export async function generateIntroMessage(input: IntroMessageInput): Promise<IntroMessageOutput> {
  return introMessageFlow(input);
}

const introMessagePrompt = ai.definePrompt({
  name: 'introMessagePrompt',
  input: {schema: IntroMessageInputSchema},
  output: {schema: IntroMessageOutputSchema},
  prompt: `You are an AI assistant that specializes in generating personalized introductory messages for job seekers. You will take the user's skills, experience, and the potential employer's information to create a compelling introduction.

  Employer: {{{employer}}}
  Job Title: {{{jobTitle}}}
  User Skills: {{#if userSkills}}{{#each userSkills}}- {{{this}}}{{/each}}{{else}}No skills listed.{{/if}}
  User Experience: {{{userExperience}}}
  Desired Tone: {{{desiredTone}}}

  Generate an introductory message that is tailored to the employer and job title, highlighting the user's relevant skills and experience. The message should be in a {{{desiredTone}}} tone.
  `,
});

const introMessageFlow = ai.defineFlow(
  {
    name: 'introMessageFlow',
    inputSchema: IntroMessageInputSchema,
    outputSchema: IntroMessageOutputSchema,
  },
  async input => {
    const {output} = await introMessagePrompt(input);
    return output!;
  }
);
