
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

const transformImageFlow = ai.defineFlow(
  {
    name: 'transformImageFlow',
    inputSchema: TransformImageInputSchema,
    outputSchema: TransformImageOutputSchema,
  },
  async input => {
    const promptParts: ({text: string} | {media: {url: string}})[] = [];
    let referenceImagesUsedDescription = "the chosen theme's general style";

    // --- Part 1: Instructions for THE USER'S PHOTO ---
    let initialInstructions = `**PRIMARY TASK: You are an AI image editor. You will edit THE USER'S PHOTO, which is the very next image in this prompt.**
Your goal is to modify ONLY THE BACKGROUND of THE USER'S PHOTO.
**CRITICAL RULE FOR THE USER'S PHOTO: The person (their face, body, pose) in THE USER'S PHOTO MUST remain clear, visible, recognizable, and COMPLETELY UNCHANGED.**
DO NOT replace, alter, or obscure the person in THE USER'S PHOTO. All thematic elements must be added BEHIND the person in THE USER'S PHOTO or as subtle environmental effects in the background of THE USER'S PHOTO that DO NOT obscure them.\n\n`;

    initialInstructions += `User's choice for question #${input.questionNumber}: ${input.choice}.\n`;

    if (input.choice === 'Code') {
      initialInstructions += `For the 'Code' theme: Add clean, futuristic, structured elements in neon orange (hex #FF8C00) to the BACKGROUND of THE USER'S PHOTO. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces integrated into the scene's background.\n`;
    } else { // Chaos
      initialInstructions += `For the 'Chaos' theme: Add glitchy, abstract, aggressive elements in neon yellow (hex #04D9FF) to the BACKGROUND of THE USER'S PHOTO. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects integrated into the scene's background.\n`;
    }
    promptParts.push({ text: initialInstructions });

    // --- Part 2: THE USER'S PHOTO (The image to be edited) ---
    promptParts.push({ media: {url: input.photoDataUri} });


    // --- Part 3: Instructions for STYLE REFERENCE IMAGES (if any) ---
    const addReferenceImagesAndInstructions = (uris: string[], themeName: string) => {
      if (uris && uris.length > 0) {
        let refIntroText = `\n**STYLE REFERENCE IMAGES FOR '${themeName}' THEME (OPTIONAL):** The image(s) that follow (if any, after this text block) are STYLE REFERENCES ONLY.
**DO NOT EDIT THESE STYLE REFERENCE IMAGES.**
Use them ONLY as inspiration for designing the BACKGROUND elements to add BEHIND the person in THE USER'S PHOTO (which was the first image provided in this prompt, right after the initial instructions).
DO NOT copy people or foreground subjects from these reference images. The person in THE USER'S PHOTO must remain the focus and unchanged.\n`;
        promptParts.push({ text: refIntroText });
        uris.forEach(uri => promptParts.push({ media: {url: uri} }));
        referenceImagesUsedDescription = `the style of provided '${themeName}' reference images and the general '${themeName}' theme`;
      }
    };

    if (input.choice === 'Code' && input.codeReferenceImageUris) {
      addReferenceImagesAndInstructions(input.codeReferenceImageUris, 'Code');
    } else if (input.choice === 'Chaos' && input.chaosReferenceImageUris) {
      addReferenceImagesAndInstructions(input.chaosReferenceImageUris, 'Chaos');
    }

    // --- Part 4: Final Reminders & Generation Request ---
    promptParts.push({
      text: `\n**FINAL CRITICAL REMINDERS FOR EDITING THE USER'S PHOTO (THE VERY FIRST IMAGE PROVIDED IN THIS PROMPT):**
1.  **The person in THE USER'S PHOTO must be entirely preserved (face, body, pose).**
2.  **All modifications MUST target the BACKGROUND of THE USER'S PHOTO ONLY.**
3.  **Any elements inspired by reference images must be integrated into the BACKGROUND of THE USER'S PHOTO, BEHIND the person.**
4.  **DO NOT cover, alter, or replace the user's face or body from THE USER'S PHOTO. The user must remain the clear, recognizable, and unchanged subject.**
Now, generate the transformed version of THE USER'S PHOTO based on these instructions. You can also provide a brief text description of the changes made to the background of THE USER'S PHOTO.`
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
        transformationDescription = `The background of the user's photo was transformed based on their choice of '${input.choice}' for question #${input.questionNumber}, inspired by ${referenceImagesUsedDescription}. The user in their original photo was intended to be kept clear, prominent, and unchanged.`;
    }
    
    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: transformationDescription,
    };
  }
);

