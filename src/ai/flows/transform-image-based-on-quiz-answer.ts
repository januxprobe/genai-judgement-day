
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

// This prompt definition is kept for schema reference but not directly used by ai.generate
// as the prompt parts are constructed dynamically for ai.generate.
const prompt = ai.definePrompt({
  name: 'transformImagePrompt',
  input: {schema: TransformImageInputSchema},
  output: {schema: TransformImageOutputSchema},
  prompt: `You are an AI image transformation service.
**Primary Objective: Modify the user's photo (provided as the very first image in the prompt) by adding thematic elements to its BACKGROUND.**
**The user's face and body in their original photo (the first image) MUST remain CLEAR, VISIBLE, and UNCHANGED. DO NOT replace or obscure the person.**

User's photo (this is the base image to modify, referred to as 'the first image'): {{media url=photoDataUri}}
User's choice for question #{{questionNumber}}: {{{choice}}}

{{#if codeReferenceImageUris}}
The following images are REFERENCE STYLES for the 'Code' theme. Use them ONLY as inspiration for how to style the BACKGROUND of the user's photo (the first image). DO NOT copy people or foreground subjects from these reference images.
{{#each codeReferenceImageUris}}
- Reference 'Code' Style Image: {{media url=this}}
{{/each}}
{{/if}}
{{#if chaosReferenceImageUris}}
The following images are REFERENCE STYLES for the 'Chaos' theme. Use them ONLY as inspiration for how to style the BACKGROUND of the user's photo (the first image). DO NOT copy people or foreground subjects from these reference images.
{{#each chaosReferenceImageUris}}
- Reference 'Chaos' Style Image: {{media url=this}}
{{/each}}
{{/if}}

Instructions based on choice:
- If choice is 'Code': Transform the BACKGROUND of the user's photo (the first image) by adding clean, futuristic, structured elements in neon orange (hex #FF8C00). If 'Code' reference images are provided, use their style to guide this background transformation.
- If choice is 'Chaos': Transform the BACKGROUND of the user's photo (the first image) by adding glitchy, abstract, aggressive elements in neon yellow (hex #04D9FF). If 'Chaos' reference images are provided, use their style to guide this background transformation.

**CRITICAL RULES:**
1.  **DO NOT change the person in the user's photo (the first image).** Their face, body, and pose must remain the same.
2.  **ONLY modify the BACKGROUND of the user's photo (the first image).**
3.  Thematic elements should appear BEHIND the user or as subtle environmental effects that DO NOT obscure the user.
4.  The user from their original photo (the first image) MUST be the clear and prominent subject of the final image.

Return the transformed image as a data URI and a brief description.
The transformedPhotoDataUri field should be a data URI with MIME type and Base64 encoding.
The transformationDescription should describe what was changed in the user's photo, referencing the user's photo as 'the first image' or 'the user's original photo'.
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

    let instructionText = `**Task: You are an AI image editor. Your primary goal is to modify the BACKGROUND of the VERY FIRST image provided (which is the user's photo). The person (face, body, pose) in this first image MUST remain clear, visible, recognizable, and UNCHANGED. Do NOT replace, alter, or obscure the person.**\n\n`;
    instructionText += `User's choice for question #${input.questionNumber}: ${input.choice}\n\n`;

    let referenceImagesUsedDescription = "the chosen theme's general style";
    let choiceSpecificInstructions = "";
    let referenceImageInstructions = "";

    const addReferenceImages = (uris: string[], themeName: string) => {
      if (uris && uris.length > 0) {
        referenceImageInstructions += `The subsequent image(s) are REFERENCE STYLES for the '${themeName}' theme. Use them ONLY as inspiration for designing the BACKGROUND elements to add BEHIND the user in their original photo (the very first image). DO NOT copy people or foreground subjects from these reference images. The user in the first image must remain the focus and unchanged.\n`;
        uris.forEach(uri => promptParts.push({media: {url: uri}}));
        referenceImagesUsedDescription = `the style of provided '${themeName}' reference images and the general '${themeName}' theme`;
      }
    };

    if (input.choice === 'Code') {
      choiceSpecificInstructions = `For the 'Code' theme, add clean, futuristic, structured elements in neon orange (hex #FF8C00) primarily **TO THE BACKGROUND BEHIND the user in their photo (the very first image)**. These elements can also be subtle additive effects around the user, but they must NOT obscure the user. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces integrated into the scene's background. Ensure the user from the first image remains the prominent, unchanged subject.\n`;
      if (input.codeReferenceImageUris) {
        addReferenceImages(input.codeReferenceImageUris, 'Code');
      }
    } else if (input.choice === 'Chaos') {
      choiceSpecificInstructions = `For the 'Chaos' theme, add glitchy, abstract, aggressive elements in neon yellow (hex #04D9FF) primarily **TO THE BACKGROUND BEHIND the user in their photo (the very first image)**. These elements can also be subtle additive effects around the user, but they must NOT obscure the user. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects integrated into the scene's background. Ensure the user from the first image remains the prominent, unchanged subject.\n`;
      if (input.chaosReferenceImageUris) {
        addReferenceImages(input.chaosReferenceImageUris, 'Chaos');
      }
    }

    instructionText += referenceImageInstructions;
    instructionText += choiceSpecificInstructions;

    instructionText += `\n**CRITICAL REMINDERS:**
1.  **The VERY FIRST image is the user's photo. Preserve the person in it ENTIRELY (face, body, pose).**
2.  **All modifications should target the BACKGROUND of this first image ONLY.**
3.  **Elements inspired by reference images (if any) must be integrated into the BACKGROUND, BEHIND the user from the first image.**
4.  **DO NOT cover, alter, or replace the user's face or body from the first image. The user must remain the clear, recognizable, and unchanged subject.**
5.  Output the modified image as a data URI.
6.  Provide a transformationDescription that accurately describes how the BACKGROUND of the user's original photo (the first image) was changed, mentioning the user's choice and theme.
`;
    
    promptParts.push({text: instructionText});

    const {media, text: modelGeneratedText} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation', // Updated model
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
      output: { schema: TransformImageOutputSchema } // Requesting output in schema
    });

    let transformedPhotoDataUri = media?.url;
    // Use the AI's description if available and seems reasonable, otherwise construct a default.
    let transformationDescription = modelGeneratedText;

    if (!transformedPhotoDataUri) {
      console.warn("AI image generation did not return a media URL. Falling back to previous image.");
      transformedPhotoDataUri = input.photoDataUri; 
      transformationDescription = "AI image generation failed to return a new image. Displaying the previous image.";
    } else if (!transformationDescription || transformationDescription.trim() === "") {
        // Fallback description if AI doesn't provide one
        transformationDescription = `The background of the user's photo (the first image provided) was transformed based on their choice of '${input.choice}' for question #${input.questionNumber}, inspired by ${referenceImagesUsedDescription}. The user from the original photo was intended to be kept clear, prominent, and unchanged.`;
    }
    
    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: transformationDescription,
    };
  }
);
