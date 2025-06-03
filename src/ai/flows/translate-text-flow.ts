
'use server';
/**
 * @fileOverview A Genkit flow to translate text to a specified target language.
 *
 * - translateText - Translates text and returns the translated version.
 * - TranslateTextInput - Input schema for the flow.
 * - TranslateTextOutput - Output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  textToTranslate: z.string().describe('The text content to be translated.'),
  targetLanguage: z.string().describe('The BCP-47 language code for the target language (e.g., "es" for Spanish, "fr" for French, "ta" for Tamil).'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translationPrompt = ai.definePrompt({
  name: 'translationPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text into {{targetLanguage}}.
Text to translate:
"{{{textToTranslate}}}"

Return only the translated text.`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const {output} = await translationPrompt(input);
    
    if (!output || typeof output.translatedText !== 'string') {
      // Fallback or error handling
      console.error('Translation failed or returned unexpected output:', output);
      // Fallback to original text if translation fails
      return { translatedText: input.textToTranslate };
    }
    return output;
  }
);

