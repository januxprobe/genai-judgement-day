
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
// as the prompt parts are constructed dynamically.
// The output schema is also defined for the flow's return type.
const prompt = ai.definePrompt({
  name: 'transformImagePrompt',
  input: {schema: TransformImageInputSchema},
  output: {schema: TransformImageOutputSchema},
  prompt: `This is a placeholder. The actual prompt is constructed dynamically in the flow.`,
});

const transformImageFlow = ai.defineFlow(
  {
    name: 'transformImageFlow',
    inputSchema: TransformImageInputSchema,
    outputSchema: TransformImageOutputSchema,
  },
  async input => {
    const promptParts: ({text: string} | {media: {url: string}})[] = [];
    let referenceImagesUsedDescription = "the chosen theme's general style"; // Default

    // Initial Core Instructions (Text first)
    let coreInstructions = `**TASK: You are an AI image editor. Your primary goal is to modify the BACKGROUND of the VERY NEXT image provided in this prompt (which is the user's photo).
    The person (face, body, pose) in this upcoming user's photo MUST remain clear, visible, recognizable, and COMPLETELY UNCHANGED.
    DO NOT replace, alter, or obscure the person. All thematic elements must be added BEHIND the user or as subtle environmental effects that DO NOT obscure the user in that photo.**\n\n`;

    coreInstructions += `User's choice for question #${input.questionNumber}: ${input.choice}.\n`;

    if (input.choice === 'Code') {
      coreInstructions += `For the 'Code' theme: Add clean, futuristic, structured elements in neon orange (hex #FF8C00) to the BACKGROUND of the user's photo. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces integrated into the scene's background.\n`;
    } else { // Chaos
      coreInstructions += `For the 'Chaos' theme: Add glitchy, abstract, aggressive elements in neon yellow (hex #04D9FF) to the BACKGROUND of the user's photo. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects integrated into the scene's background.\n`;
    }
    promptParts.push({ text: coreInstructions });

    // User's Photo (Image second) - THIS IS THE IMAGE TO EDIT
    promptParts.push({ media: {url: input.photoDataUri} });

    // Reference Images and their specific instructions (if any)
    const addReferenceImagesAndInstructions = (uris: string[], themeName: string) => {
      if (uris && uris.length > 0) {
        let refText = `\n**REFERENCE IMAGES FOR '${themeName}' THEME:** The following image(s) are style references.
        Use them ONLY as inspiration for designing the BACKGROUND elements to add BEHIND the user in their photo (which was the image provided just before this text block, and after the initial core instructions).
        DO NOT copy people or foreground subjects from these reference images. The user in their photo must remain the focus and unchanged.\n`;
        promptParts.push({ text: refText });
        uris.forEach(uri => promptParts.push({ media: {url: uri} }));
        referenceImagesUsedDescription = `the style of provided '${themeName}' reference images and the general '${themeName}' theme`;
      }
    };

    if (input.choice === 'Code' && input.codeReferenceImageUris) {
      addReferenceImagesAndInstructions(input.codeReferenceImageUris, 'Code');
    } else if (input.choice === 'Chaos' && input.chaosReferenceImageUris) {
      addReferenceImagesAndInstructions(input.chaosReferenceImageUris, 'Chaos');
    }

    // Final Text Part: Reiterate critical rules and ask for generation
    promptParts.push({
      text: `\n**CRITICAL REMINDERS FOR PROCESSING THE USER'S PHOTO (THE IMAGE THAT WAS PROVIDED IMMEDIATELY AFTER THE INITIAL SET OF INSTRUCTIONS):**
1.  **Preserve the person in THE USER'S PHOTO ENTIRELY (face, body, pose).**
2.  **All modifications should target the BACKGROUND of THIS USER'S PHOTO ONLY.**
3.  **Elements inspired by reference images (if any) must be integrated into the BACKGROUND, BEHIND the user in THEIR PHOTO.**
4.  **DO NOT cover, alter, or replace the user's face or body from THEIR PHOTO. The user must remain the clear, recognizable, and unchanged subject.**
Generate the transformed image. You can also provide a brief text description of the changes made to the background of the user's original photo.`
    });
    
    const {media, text: modelGeneratedText} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // Sticking to recommended model for Genkit image gen
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
      // No explicit output schema here to avoid "JSON mode" errors with image models
    });

    let transformedPhotoDataUri = media?.url;
    let transformationDescription = modelGeneratedText;

    if (!transformedPhotoDataUri) {
      console.warn("AI image generation did not return a media URL. Falling back to previous image.");
      transformedPhotoDataUri = input.photoDataUri; 
      transformationDescription = "AI image generation failed to return a new image. Displaying the previous image.";
    } else if (!transformationDescription || transformationDescription.trim() === "") {
        // referenceImagesUsedDescription is updated within addReferenceImagesAndInstructions or uses default
        transformationDescription = `The background of the user's photo was transformed based on their choice of '${input.choice}' for question #${input.questionNumber}, inspired by ${referenceImagesUsedDescription}. The user in their original photo was intended to be kept clear, prominent, and unchanged.`;
    }
    
    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: transformationDescription,
    };
  }
);

