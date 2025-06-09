
'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers, optionally using arrays of reference images for thematic inspiration.
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
  codeReferenceImageUris: z.array(z.string()).optional().describe(
    "Optional array of reference images for 'Code' theme, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  chaosReferenceImageUris: z.array(z.string()).optional().describe(
    "Optional array of reference images for 'Chaos' theme, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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

// This defined prompt is not directly used by the ai.generate call below,
// as promptParts are constructed dynamically. It's kept for potential future use or different invocation patterns.
const prompt = ai.definePrompt({
  name: 'transformImagePrompt',
  input: {schema: TransformImageInputSchema},
  output: {schema: TransformImageOutputSchema},
  prompt: `You are an AI image transformation service. Your task is to modify a user's photo by adding thematic elements based on their quiz choice of 'Code' or 'Chaos'.
Optionally, one or more reference images may be provided for the chosen theme to guide the style of the transformation.

**Critically important: The user's face and body MUST remain clear, visible, and recognizable. Transformations should primarily affect the background or be additive elements that DO NOT obscure the person.**

User's photo: {{media url=photoDataUri}}
User's choice for question #{{questionNumber}}: {{{choice}}}

{{#if codeReferenceImageUris}}
Reference images for 'Code' theme (use for inspiration):
{{#each codeReferenceImageUris}}
- {{media url=this}}
{{/each}}
{{/if}}
{{#if chaosReferenceImageUris}}
Reference images for 'Chaos' theme (use for inspiration):
{{#each chaosReferenceImageUris}}
- {{media url=this}}
{{/each}}
{{/if}}

Based on their choice (and any provided reference images):
- If the choice is 'Code', add clean, futuristic, and structured elements in neon orange (hex #FF8C00) to the background or around the user. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces.
- If the choice is 'Chaos', add glitchy, abstract, and aggressive elements in neon yellow (hex #04D9FF) to the background or around the user. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects.

**Reiterate: Do NOT cover or distort the user's face or body significantly. The person should be the clear subject. If reference images are used, draw inspiration from them for the thematic elements, but the primary subject remains the user's photo.**

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
      {media: {url: input.photoDataUri}}, // User's photo first
    ];

    let instructionText = `The first image provided in this prompt is the user's photo. **This user's photo is the primary subject and MUST NOT be replaced or significantly obscured. The user's face and body must remain clear, visible, and recognizable.**
Your task is to augment this user's photo. Based on their choice of '${input.choice}' for question #${input.questionNumber}:`;

    let referenceImagesUsed = false;
    let choiceSpecificInstructions = "";

    if (input.choice === 'Code') {
      choiceSpecificInstructions = ` Add clean, futuristic, structured elements in neon orange (hex #FF8C00) primarily **to the background of the user's photo (the first image)** or as subtle additive elements around the user. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces.`;
      if (input.codeReferenceImageUris && input.codeReferenceImageUris.length > 0) {
        input.codeReferenceImageUris.forEach(uri => promptParts.push({media: {url: uri}}));
        choiceSpecificInstructions += ` The subsequent image(s) (following the user's photo in this prompt) are reference styles for the 'Code' theme. Use these for inspiration when adding the 'Code' elements. Apply these elements thoughtfully, ensuring they enhance, not obscure, the user.`;
        referenceImagesUsed = true;
      }
    } else if (input.choice === 'Chaos') {
      choiceSpecificInstructions = ` Add glitchy, abstract, aggressive elements in neon yellow (hex #04D9FF) primarily **to the background of the user's photo (the first image)** or as subtle additive elements around the user. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects.`;
      if (input.chaosReferenceImageUris && input.chaosReferenceImageUris.length > 0) {
        input.chaosReferenceImageUris.forEach(uri => promptParts.push({media: {url: uri}}));
        choiceSpecificInstructions += ` The subsequent image(s) (following the user's photo in this prompt) are reference styles for the 'Chaos' theme. Use these for inspiration when adding the 'Chaos' elements. Apply these elements thoughtfully, ensuring they enhance, not obscure, the user.`;
        referenceImagesUsed = true;
      }
    }
    instructionText += choiceSpecificInstructions;
    instructionText += `\n\n**Critically reiterate: The final output image must be the original user (from the first image) with these thematic elements added. The user must remain the clear, recognizable subject.** Return the transformed image as a data URI.`;
    
    promptParts.push({text: instructionText});


    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [ 
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ],
      },
    });

    let transformedPhotoDataUri = media.url;
    if (!transformedPhotoDataUri) {
      console.warn("AI image generation did not return a media URL. Falling back to previous image.");
      transformedPhotoDataUri = input.photoDataUri; // Fallback to the user's original image if generation fails
    }
    
    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: `The image was transformed based on the user's choice of ${input.choice} for question #${input.questionNumber}, focusing on thematic background elements inspired by ${referenceImagesUsed ? 'reference images and ' : ''}the chosen theme, while keeping the user clear.`,
    };
  }
);

