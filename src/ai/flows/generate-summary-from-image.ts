'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a summary based on a transformed image.
 *
 * - generateSummaryFromImage - A function that generates a summary from an image.
 * - GenerateSummaryFromImageInput - The input type for the generateSummaryFromImage function.
 * - GenerateSummaryFromImageOutput - The return type for the generateSummaryFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSummaryFromImageInputSchema = z.object({
  transformedPhotoDataUri: z
    .string()
    .describe(
      "The final transformed photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateSummaryFromImageInput = z.infer<typeof GenerateSummaryFromImageInputSchema>;

const GenerateSummaryFromImageOutputSchema = z.object({
  summary: z.string().describe('A summary of the transformed image.'),
});
export type GenerateSummaryFromImageOutput = z.infer<typeof GenerateSummaryFromImageOutputSchema>;

export async function generateSummaryFromImage(
  input: GenerateSummaryFromImageInput
): Promise<GenerateSummaryFromImageOutput> {
  return generateSummaryFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryFromImagePrompt',
  input: {schema: GenerateSummaryFromImageInputSchema},
  output: {schema: GenerateSummaryFromImageOutputSchema},
  prompt: `You are an AI that summarizes images.  Based on the image provided, create a summary of the image.

Image: {{media url=transformedPhotoDataUri}}`,
});

const generateSummaryFromImageFlow = ai.defineFlow(
  {
    name: 'generateSummaryFromImageFlow',
    inputSchema: GenerateSummaryFromImageInputSchema,
    outputSchema: GenerateSummaryFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
