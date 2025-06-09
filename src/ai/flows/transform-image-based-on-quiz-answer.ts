'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers.
 *
 * - transformImage - A function that transforms the image based on quiz choices.
 * - TransformImageInput - The input type for the transformImage function.
 * - TransformImageOutput - The return type for the transformImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransformImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  choice: z.enum(['Code', 'Chaos']).describe('The user\'s choice for the current question.'),
  questionNumber: z.number().describe('The question number in the quiz.'),
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

const prompt = ai.definePrompt({
  name: 'transformImagePrompt',
  input: {schema: TransformImageInputSchema},
  output: {schema: TransformImageOutputSchema},
  prompt: `You are an AI image transformation service. Based on the user's choice of 'Code' or 'Chaos' in the quiz, you will add thematic elements to their photo.

  The user's photo is provided as a data URI:
  {{media url=photoDataUri}}

  The user's choice for question #{{questionNumber}} is: {{{choice}}}

  Based on their choice, transform the image add thematic elements to the background of the photo that reflect the user's choice. If the choice is 'Code', add clean, futuristic elements in neon orange. If the choice is 'Chaos', add glitchy, aggressive elements in neon yellow.

  Return the transformed image as a data URI and provide a description of the transformation.

  Make sure to return the entire object as specified by the TransformImageOutputSchema. The transformedPhotoDataUri field should be a data URI with MIME type and Base64 encoding, for example: 'data:image/png;base64,<encoded_data>'.
  `,
});

const transformImageFlow = ai.defineFlow(
  {
    name: 'transformImageFlow',
    inputSchema: TransformImageInputSchema,
    outputSchema: TransformImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        {media: {url: input.photoDataUri}},
        {text: `Transform the image of the user, given their choice of ${input.choice} for question #${input.questionNumber}. If the choice is 'Code', add clean, futuristic elements in neon orange. If the choice is 'Chaos', add glitchy, aggressive elements in neon yellow.`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Fallback in case the image generation fails to return a data URI.
    let transformedPhotoDataUri = media.url;
    if (!transformedPhotoDataUri) {
      transformedPhotoDataUri = input.photoDataUri; // Or a default image if you have one.
    }

    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: `The image was transformed based on the user's choice of ${input.choice} for question #${input.questionNumber}.`,
    };
  }
);
