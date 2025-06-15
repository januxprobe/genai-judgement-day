
'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers and a pre-generated theme description.
 * This flow uses a pre-generated description of reference themes to guide an image generation model
 * to create a new background while preserving the user's face, body, and pose, and potentially altering their clothing.
 *
 * - transformImage - A function that transforms the image based on quiz choices and a theme description.
 * - TransformImageInput - The input type for the transformImage function.
 * - TransformImageOutput - The return type for the transformImage function.
 */

import { ai } from '@/ai/genkit';
import {z} from 'genkit';
import { createKontextRequest, pollKontextResult } from '@/lib/flux-kontext-api';

const TransformImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a REAL HUMAN USER (THE USER PHOTO), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  choice: z.enum(['TerminAEtor', 'TerminAItor']).describe('The user\'s choice for the current question. TerminAEtor for orderly/code-like, TerminAItor for chaotic/unpredictable.'),
  questionNumber: z.number().describe('The question number in the quiz.'),
  referenceThemeDescription: z.string().optional().describe(
    "A pre-generated textual description of the chosen theme's reference elements, objects, props, and overall style. This description is derived from analyzing one or more reference images for the theme."
  ),
});
export type TransformImageInput = z.infer<typeof TransformImageInputSchema>;

const TransformImageOutputSchema = z.object({
  transformedPhotoDataUri: z
    .string()
    .describe("The transformed photo of the user, as a data URI."),
  transformationDescription: z.string().describe('A description of the transformation applied.'),
});
export type TransformImageOutput = z.infer<typeof TransformImageOutputSchema>;

export async function transformImage(input: TransformImageInput): Promise<TransformImageOutput> {
  return transformImageFlow(input);
}

const transformImageFlow = ai.defineFlow(
  {
    name: 'transformImageFlow',
    inputSchema: TransformImageInputSchema,
    outputSchema: TransformImageOutputSchema,
  },
  async (input) => {
    const themeName = input.choice;
    let prompt = `A photo of a user. Please edit the background to incorporate elements of the ${themeName} theme.`;

    if (input.referenceThemeDescription) {
      prompt += ` The theme is described as: ${input.referenceThemeDescription}.`;
    }

    prompt += ` Please preserve the user's face, body, and pose. The user should not be altered.`;

    const base64Image = input.photoDataUri.split(',')[1];

    const requestId = await createKontextRequest(prompt, base64Image);
    const imageUrl = await pollKontextResult(requestId);

    // To use the image in a data URI, we need to fetch it and convert it to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const transformedPhotoDataUri = `data:${mimeType};base64,${imageBase64}`;

    let transformationDescription = `The user's photo was transformed based on the ${themeName} theme.`;
    if (input.referenceThemeDescription) {
        transformationDescription += ` The specific theme description was: ${input.referenceThemeDescription}.`;
    }

    return {
      transformedPhotoDataUri,
      transformationDescription,
    };
  }
);
