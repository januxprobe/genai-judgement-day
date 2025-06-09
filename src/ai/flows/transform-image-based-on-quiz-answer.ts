
'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers, optionally using reference images for thematic inspiration.
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
  codeReferenceImageUri: z.string().optional().describe(
    "Optional reference image for 'Code' theme, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  chaosReferenceImageUri: z.string().optional().describe(
    "Optional reference image for 'Chaos' theme, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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

const prompt = ai.definePrompt({
  name: 'transformImagePrompt',
  input: {schema: TransformImageInputSchema},
  output: {schema: TransformImageOutputSchema},
  prompt: `You are an AI image transformation service. Your task is to modify a user's photo by adding thematic elements based on their quiz choice of 'Code' or 'Chaos'.
Optionally, a reference image may be provided for the chosen theme to guide the style of the transformation.

**Critically important: The user's face and body MUST remain clear, visible, and recognizable. Transformations should primarily affect the background or be additive elements that DO NOT obscure the person.**

User's photo: {{media url=photoDataUri}}
User's choice for question #{{questionNumber}}: {{{choice}}}

{{#if codeReferenceImageUri}}
Reference image for 'Code' theme (use for inspiration): {{media url=codeReferenceImageUri}}
{{/if}}
{{#if chaosReferenceImageUri}}
Reference image for 'Chaos' theme (use for inspiration): {{media url=chaosReferenceImageUri}}
{{/if}}

Based on their choice (and any provided reference image):
- If the choice is 'Code', add clean, futuristic, and structured elements in neon orange (hex #FF8C00) to the background or around the user. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces.
- If the choice is 'Chaos', add glitchy, abstract, and aggressive elements in neon yellow (hex #04D9FF) to the background or around the user. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects.

**Reiterate: Do NOT cover or distort the user's face or body significantly. The person should be the clear subject. If a reference image is used, draw inspiration from it for the thematic elements, but the primary subject remains the user's photo.**

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
    const promptParts: ({text: string} | {media: {url: string}})[] = [
      {media: {url: input.photoDataUri}},
    ];

    let instructionText = `Transform the image of the user, given their choice of '${input.choice}' for question #${input.questionNumber}.
**Critically important: The user's face and body MUST remain clear, visible, and recognizable. Transformations should primarily affect the background or be additive elements that DO NOT obscure the person.**`;

    if (input.choice === 'Code') {
      instructionText += ` Add clean, futuristic, structured elements in neon orange to the background or around the user.`;
      if (input.codeReferenceImageUri) {
        promptParts.push({media: {url: input.codeReferenceImageUri}});
        instructionText += ` Use the provided reference image (the second image in this prompt) as inspiration for these 'Code' elements. Apply them thoughtfully to enhance, not obscure, the user.`;
      }
    } else if (input.choice === 'Chaos') {
      instructionText += ` Add glitchy, abstract, aggressive elements in neon yellow to the background or around the user.`;
      if (input.chaosReferenceImageUri) {
        promptParts.push({media: {url: input.chaosReferenceImageUri}});
        instructionText += ` Use the provided reference image (the second image in this prompt) as inspiration for these 'Chaos' elements. Apply them thoughtfully to enhance, not obscure, the user.`;
      }
    }
    promptParts.push({text: instructionText});


    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    let transformedPhotoDataUri = media.url;
    if (!transformedPhotoDataUri) {
      transformedPhotoDataUri = input.photoDataUri; 
    }

    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: `The image was transformed based on the user's choice of ${input.choice} for question #${input.questionNumber}, focusing on thematic background elements while keeping the user clear. ${ (input.choice === 'Code' && input.codeReferenceImageUri) || (input.choice === 'Chaos' && input.chaosReferenceImageUri) ? 'A reference image was used for inspiration.' : ''}`,
    };
  }
);
