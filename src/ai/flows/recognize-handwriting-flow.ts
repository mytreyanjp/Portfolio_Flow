
'use server';
/**
 * @fileOverview A Genkit flow to recognize handwritten text from an image and detect its language.
 *
 * - recognizeHandwriting - Recognizes text and language from an image data URI.
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
  detectedLanguage: z.string().optional().describe('The BCP-47 language code of the recognized text (e.g., "en", "ta", "hi"). Return undefined if unsure.'),
});
export type RecognizeHandwritingOutput = z.infer<typeof RecognizeHandwritingOutputSchema>;

export async function recognizeHandwriting(input: RecognizeHandwritingInput): Promise<RecognizeHandwritingOutput> {
  return recognizeHandwritingFlow(input);
}

const handwritingPrompt = ai.definePrompt({
  name: 'handwritingRecognitionPrompt',
  input: {schema: RecognizeHandwritingInputSchema},
  output: {schema: RecognizeHandwritingOutputSchema},
  prompt: `Analyze the following image, which contains a handwritten name. 
Your tasks are:
1. Recognize and extract this name. Return only the recognized name as a string for the 'recognizedText' field. If the writing is unclear or uninterpretable as a name, try your best or return an empty string for 'recognizedText'.
2. Identify the primary language of the script used for the handwritten name. Return this as a BCP-47 language code (e.g., "en" for English, "ta" for Tamil, "hi" for Hindi) for the 'detectedLanguage' field. If the language is ambiguous or cannot be determined, you may omit the 'detectedLanguage' field or return undefined.

Image: {{media url=imageDataUri}}`,
});

const recognizeHandwritingFlow = ai.defineFlow(
  {
    name: 'recognizeHandwritingFlow',
    inputSchema: RecognizeHandwritingInputSchema,
    outputSchema: RecognizeHandwritingOutputSchema,
  },
  async (input) => {
    const {output} = await handwritingPrompt(input);
    
    if (!output) {
      return { recognizedText: '', detectedLanguage: undefined };
    }
    return {
      recognizedText: output.recognizedText || '',
      detectedLanguage: output.detectedLanguage,
    };
  }
);

