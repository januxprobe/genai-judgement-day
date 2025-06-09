
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
  prompt: `You are an AI image transformation service. Your task is to modify a user's photo by adding thematic elements based on their quiz choice of 'Code' or 'Chaos'.

  **Critically important: The user's face and body MUST remain clear, visible, and recognizable. Transformations should primarily affect the background or be additive elements that DO NOT obscure the person.**

  The user's photo is provided as a data URI:
  {{media url=photoDataUri}}

  The user's choice for question #{{questionNumber}} is: {{{choice}}}

  Based on their choice, transform the image:
  - If the choice is 'Code', add clean, futuristic, and structured elements in neon orange (hex #FF8C00) to the background or around the user. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces.
  - If the choice is 'Chaos', add glitchy, abstract, and aggressive elements in neon yellow (hex #04D9FF) to the background or around the user. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects.

  **Reiterate: Do NOT cover or distort the user's face or body significantly. The person should be the clear subject.**

  Return the transformed image as a data URI and provide a brief description of the transformation applied, focusing on how the theme was incorporated while preserving the user's likeness.

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
        {text: `Transform the image of the user, given their choice of ${input.choice} for question #${input.questionNumber}.
        If the choice is 'Code', add clean, futuristic, structured elements in neon orange to the background or around the user.
        If the choice is 'Chaos', add glitchy, abstract, aggressive elements in neon yellow to the background or around the user.
        **Crucially, ensure the user's face and body remain clear, visible, and recognizable. Do not obscure the person.**`},
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
      transformationDescription: `The image was transformed based on the user's choice of ${input.choice} for question #${input.questionNumber}, focusing on thematic background elements while keeping the user clear.`,
    };
  }
);

