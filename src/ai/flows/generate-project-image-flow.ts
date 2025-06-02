
'use server';
/**
 * @fileOverview A Genkit flow to generate an image for a project based on its description.
 *
 * - generateProjectImage - Generates an image and returns its data URI.
 * - GenerateProjectImageInput - Input schema for the flow.
 * - GenerateProjectImageOutput - Output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProjectImageInputSchema = z.object({
  description: z.string().describe('A short description of the project to generate an image for.'),
});
export type GenerateProjectImageInput = z.infer<typeof GenerateProjectImageInputSchema>;

const GenerateProjectImageOutputSchema = z.object({
  imageUrl: z.string().describe('The generated image as a data URI.'),
});
export type GenerateProjectImageOutput = z.infer<typeof GenerateProjectImageOutputSchema>;

export async function generateProjectImage(input: GenerateProjectImageInput): Promise<GenerateProjectImageOutput> {
  return generateProjectImageFlow(input);
}

const generateProjectImageFlow = ai.defineFlow(
  {
    name: 'generateProjectImageFlow',
    inputSchema: GenerateProjectImageInputSchema,
    outputSchema: GenerateProjectImageOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: `Generate a visually appealing and representative image for a project with the following description: "${input.description}". The image should be suitable for a project portfolio card.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [ // Add safety settings to be less restrictive if needed
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed or returned no media.');
    }

    return { imageUrl: media.url };
  }
);
