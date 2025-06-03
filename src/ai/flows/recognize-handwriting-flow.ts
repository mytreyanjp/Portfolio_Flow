
'use server';
/**
 * @fileOverview A Genkit flow to recognize handwritten text from an image.
 *
 * - recognizeHandwriting - Recognizes text from an image data URI.
 * - RecognizeHandwritingInput - Input schema for the flow.
 * - RecognizeHandwritingOutput - Output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeHandwritingInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The handwritten drawing as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
    ),
});
export type RecognizeHandwritingInput = z.infer<typeof RecognizeHandwritingInputSchema>;

const RecognizeHandwritingOutputSchema = z.object({
  recognizedText: z.string().describe('The recognized text from the image. This should be the name written by the user.'),
});
export type RecognizeHandwritingOutput = z.infer<typeof RecognizeHandwritingOutputSchema>;

export async function recognizeHandwriting(input: RecognizeHandwritingInput): Promise<RecognizeHandwritingOutput> {
  return recognizeHandwritingFlow(input);
}

const handwritingPrompt = ai.definePrompt({
  name: 'handwritingRecognitionPrompt',
  input: {schema: RecognizeHandwritingInputSchema},
  output: {schema: RecognizeHandwritingOutputSchema},
  prompt: `Analyze the following image, which contains a handwritten name. Your task is to recognize and extract this name. 
Return only the recognized name as a string. If the writing is unclear or uninterpretable as a name, try your best or return an empty string.
Image: {{media url=imageDataUri}}`,
});

const recognizeHandwritingFlow = ai.defineFlow(
  {
    name: 'recognizeHandwritingFlow',
    inputSchema: RecognizeHandwritingInputSchema,
    outputSchema: RecognizeHandwritingOutputSchema,
  },
  async (input) => {
    // Note: The global `ai.generate` uses 'googleai/gemini-2.0-flash' by default from src/ai/genkit.ts
    // This model should support multimodal inputs.
    const {output} = await handwritingPrompt(input);
    
    if (!output || typeof output.recognizedText !== 'string') {
      // Fallback or error handling if the model output is not as expected
      return { recognizedText: '' };
    }
    return output;
  }
);
