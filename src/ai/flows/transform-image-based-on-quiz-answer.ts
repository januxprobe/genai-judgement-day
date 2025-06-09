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
    let coreInstructions = `**AI IMAGE EDITOR TASK: Your primary goal is to modify THE USER PHOTO by generating a NEW BACKGROUND for it, inspired by the chosen theme and any provided STYLE REFERENCE IMAGES.**

**CRITICAL RULES FOR THE USER PHOTO:**
1.  THE USER PHOTO (which will be the first image provided right after these initial instructions) contains a person.
2.  **This person (their face, body, pose, clothing, and anything they are holding or interacting with in their immediate foreground) from THE USER PHOTO MUST remain absolutely clear, visible, recognizable, and COMPLETELY UNCHANGED.** They are the FOREGROUND.
3.  You will GENERATE a NEW BACKGROUND. This NEW BACKGROUND should be placed *behind* the preserved person from THE USER PHOTO.
4.  DO NOT replace, alter, obscure, or add effects *on top of* the person in THE USER PHOTO. All generated elements must be in the NEW BACKGROUND.

Theme choice for question #${input.questionNumber}: **${input.choice}**.

`;

    if (input.choice === 'Code') {
      coreInstructions += `For the 'Code' theme: Generate a NEW BACKGROUND featuring clean, futuristic, structured elements in neon orange (hex #FF8C00). Think circuit patterns, glowing geometric shapes, or sleek digital interfaces. This NEW BACKGROUND will be placed behind the person in THE USER PHOTO.\n`;
    } else { // Chaos
      coreInstructions += `For the 'Chaos' theme: Generate a NEW BACKGROUND featuring glitchy, abstract, aggressive elements in neon yellow (hex #04D9FF). Think distorted digital artifacts, chaotic energy lines, or fragmented light effects. This NEW BACKGROUND will be placed behind the person in THE USER PHOTO.\n`;
    }
    promptParts.push({ text: coreInstructions });

    // --- Part 2: THE USER PHOTO (The image whose background is to be replaced by a new generation) ---
    promptParts.push({ text: "**THE USER PHOTO (Keep person in foreground, generate new background behind them):**" });
    promptParts.push({ media: {url: input.photoDataUri} });


    // --- Part 3: STYLE REFERENCE IMAGES (Inspiration for the NEW BACKGROUND) ---
    const addReferenceImagesAndInstructions = (uris: string[], themeName: string) => {
      if (uris && uris.length > 0) {
        let refIntroText = `\n\n**STYLE REFERENCE IMAGES FOR '${themeName}' THEME (OPTIONAL INSPIRATION FOR THE *NEW BACKGROUND*):**
The image(s) that follow are STYLE REFERENCES ONLY.
**DO NOT EDIT THESE STYLE REFERENCE IMAGES.**
Use their style, theme, colors, and mood ONLY as inspiration for GENERATING the NEW BACKGROUND that will go behind the person in THE USER PHOTO (the first image provided).
**DO NOT copy people, foreground subjects, or large distinct objects directly from these reference images into the new background.** The goal is stylistic inspiration, not direct copying. The person in THE USER PHOTO must remain the sole human subject and completely unchanged.\n`;
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
      text: `\n\n**FINAL TASK: Generate the composite image.**
This means:
1.  Take the original person from THE USER PHOTO (the very first image provided) completely unchanged.
2.  GENERATE a NEW BACKGROUND according to the '${input.choice}' theme and inspired by the style of any provided STYLE REFERENCE IMAGES.
3.  Place this NEWLY GENERATED background *behind* the original person.
Ensure the person from THE USER PHOTO is the clear, unchanged foreground, and the new elements are only in the generated background behind them.

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
      // No output schema here as it caused issues with image models
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

