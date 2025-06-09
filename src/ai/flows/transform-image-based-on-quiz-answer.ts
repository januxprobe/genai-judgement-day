
'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers, optionally using arrays of reference images for thematic inspiration.
 * The AI's task is to preserve the person in the user's photo and generate a new background behind them.
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
      "A photo of the user (THE USER PHOTO), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  choice: z.enum(['Code', 'Chaos']).describe('The user\'s choice for the current question.'),
  questionNumber: z.number().describe('The question number in the quiz.'),
  codeReferenceImageUris: z.array(z.string()).optional().describe(
    "Optional array of STYLE REFERENCE IMAGES for 'Code' theme, as data URIs. These are for style inspiration only. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  chaosReferenceImageUris: z.array(z.string()).optional().describe(
    "Optional array of STYLE REFERENCE IMAGES for 'Chaos' theme, as data URIs. These are for style inspiration only. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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
  async input => {
    const promptParts: ({text: string} | {media: {url: string}})[] = [];
    let referenceImagesUsedDescription = "the chosen theme's general style";

    // --- Part 1: CORE INSTRUCTIONS ---
    let coreInstructions = `**TASK: BACKGROUND REPLACEMENT FOR THE USER PHOTO**

You will be given a primary image called "THE USER PHOTO". This photo contains a person.
Your goal is to:
1.  **IDENTIFY and PRESERVE THE PERSON** in "THE USER PHOTO". This person, including their face, body, clothing, and pose, MUST remain completely unchanged, clear, and visible in the foreground. They are the main subject.
2.  **REPLACE THE EXISTING BACKGROUND** of "THE USER PHOTO" with a new, A.I.-generated background.
3.  This new A.I.-generated background should be inspired by the chosen theme for question #${input.questionNumber}: **${input.choice}**.
    - If 'Code': The new background should feature clean, futuristic, structured elements in neon orange (hex #FF8C00). Think circuit patterns, glowing geometric shapes, or sleek digital interfaces.
    - If 'Chaos': The new background should feature glitchy, abstract, aggressive elements in neon yellow (hex #04D9FF). Think distorted digital artifacts, chaotic energy lines, or fragmented light effects.
4.  If "STYLE REFERENCE IMAGES" are provided later (after THE USER PHOTO), use their visual style, mood, colors, and textures as *additional inspiration* for the A.I.-generated background. **DO NOT copy people or large, distinct foreground objects from the STYLE REFERENCE IMAGES.** They are for style guidance only for the new background.

**CRITICAL RULE: THE PERSON FROM "THE USER PHOTO" MUST NOT BE ALTERED, REPLACED, OR OBSCURED IN ANY WAY. Only their original background is to be replaced with a new A.I.-generated one.**
`;
    promptParts.push({ text: coreInstructions });

    // --- Part 2: THE USER PHOTO (The image whose background is to be replaced by a new generation) ---
    promptParts.push({ text: "\n**THE USER PHOTO (Identify person, keep them 100% unchanged, replace their background):**" });
    promptParts.push({ media: {url: input.photoDataUri} });


    // --- Part 3: STYLE REFERENCE IMAGES (Inspiration for the NEWLY GENERATED BACKGROUND) ---
    const addReferenceImagesAndInstructions = (uris: string[], themeName: string) => {
      if (uris && uris.length > 0) {
        let refIntroText = `\n\n**STYLE REFERENCE IMAGES FOR '${themeName}' THEME (OPTIONAL INSPIRATION for the A.I.-generated background that will replace the background of THE USER PHOTO):**
These images provide stylistic cues (colors, textures, mood) for the NEW background.
**DO NOT directly copy elements, especially people or prominent foreground objects, from these reference images.**
Their style should influence the *newly generated background* you create for THE USER PHOTO. The person in THE USER PHOTO must remain the sole human subject and unchanged.\n`;
        promptParts.push({ text: refIntroText });
        uris.forEach((uri, index) => {
            promptParts.push({text: `Style Reference Image ${index+1} for ${themeName}:`});
            promptParts.push({ media: {url: uri} });
        });
        referenceImagesUsedDescription = `the style of provided '${themeName}' reference images and the general '${themeName}' theme`;
      }
    };

    if (input.choice === 'Code' && input.codeReferenceImageUris && input.codeReferenceImageUris.length > 0) {
      addReferenceImagesAndInstructions(input.codeReferenceImageUris, 'Code');
    } else if (input.choice === 'Chaos' && input.chaosReferenceImageUris && input.chaosReferenceImageUris.length > 0) {
      addReferenceImagesAndInstructions(input.chaosReferenceImageUris, 'Chaos');
    }

    // --- Part 4: Final Generation Request & Output Description ---
    promptParts.push({
      text: `\n\n**FINAL INSTRUCTION: Generate the image.**
1.  Take the person from "THE USER PHOTO" (the very first image provided) and ensure they are perfectly preserved and unchanged in the foreground.
2.  Replace their original background with a new A.I.-generated background. This new background must reflect the '${input.choice}' theme and be stylistically inspired by any provided "STYLE REFERENCE IMAGES".
3.  All generated elements MUST ONLY be in this new background, BEHIND the preserved person.
You can also provide a brief text description of the newly generated background and how it incorporates the theme and style references.`
    });
    
    const {media, text: modelGeneratedText} = await ai.generate({
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

    let transformedPhotoDataUri = media?.url;
    let transformationDescription = modelGeneratedText;

    if (!transformedPhotoDataUri) {
      console.warn("AI image generation did not return a media URL. Falling back to previous image.");
      transformedPhotoDataUri = input.photoDataUri; 
      transformationDescription = "AI image generation failed to return a new image. Displaying the previous image.";
    } else if (!transformationDescription || transformationDescription.trim() === "") {
        transformationDescription = `A new background was generated for the user's photo based on their choice of '${input.choice}' for question #${input.questionNumber}, inspired by ${referenceImagesUsedDescription}. The user in their original photo was intended to be kept clear, prominent, and unchanged in the foreground.`;
    }
    
    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: transformationDescription,
    };
  }
);

    