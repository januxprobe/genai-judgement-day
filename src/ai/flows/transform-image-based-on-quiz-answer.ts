
'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers.
 * This flow now uses a two-step AI process:
 * 1. If reference images are provided, they are first analyzed by a text model to generate a style description.
 * 2. The user's photo and this style description (or a default theme description) are then used to guide an image generation model
 *    to create a new background while preserving the user.
 *
 * - transformImage - A function that transforms the image based on quiz choices.
 * - TransformImageInput - The input type for the transformImage function.
 * - TransformImageOutput - The return type for the transformImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as fs from 'fs/promises';
import * as path from 'path';

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
    let styleDescriptionFromReferences = "";
    const referenceImageUris = input.choice === 'Code' ? input.codeReferenceImageUris : input.chaosReferenceImageUris;
    const themeName = input.choice;
    // This variable holds the original paths that were attempted to be loaded for this theme.
    // It's defined in quiz/page.tsx and passed through the input if converted.
    // For logging, we need to know which paths these URIs came from.
    // Let's assume CODE_REFERENCE_IMAGE_PATHS and CHAOS_REFERENCE_IMAGE_PATHS are somehow accessible or inferred for logging.
    // For now, we'll just log the URIs themselves in the prompt parts.
    // The quiz page can determine the original paths for `imageUrlToDataUri`.

    const originalPathsForTheme = (() => {
        // This is a simplified way to get paths; in a real app, this might come from a config or constants file
        // Re-declaring them here for clarity in the log context, ideally these would be imported.
        const CODE_PATHS = ['/reference-themes/code-style-1.png'];
        const CHAOS_PATHS = ['/reference-themes/chaos-style-1.png'];
        return input.choice === 'Code' ? CODE_PATHS : CHAOS_PATHS;
    })();


    // STEP 1: Analyze Reference Images to get a Style Description (if provided)
    if (referenceImageUris && referenceImageUris.length > 0) {
      const styleAnalysisPromptParts: ({text: string} | {media: {url: string}})[] = [];
      styleAnalysisPromptParts.push({
        text: `You are an expert art critic. Analyze the following images provided for the '${themeName}' theme.
Describe their overall artistic style, mood, dominant colors, key visual elements (like shapes, patterns, textures), and any recurring motifs.
Focus on descriptive terms that could guide an AI in generating a new, visually consistent background image.
Be concise and focus on visual characteristics. For example: "A dark, gritty style with neon blue circuit patterns, sharp geometric shapes, and a sense of digital decay."
Do not describe any people or specific objects in the reference images, only the overall style.
Reference Images for '${themeName}':`
      });
      referenceImageUris.forEach(uri => styleAnalysisPromptParts.push({ media: {url: uri} }));

      console.log("DEBUG: Style Analysis - Prompt Parts being sent to AI (contains data URIs):", JSON.stringify(styleAnalysisPromptParts, null, 2));
      console.log("DEBUG: Style Analysis - Original reference image paths for this analysis step:", originalPathsForTheme);

      try {
        const logFilePath = path.join(process.cwd(), 'ai_prompt_debug.log');
        const logContent = `\n\n--- ${new Date().toISOString()} ---\nStyle Analysis for theme '${themeName}':\nOriginal reference image paths used for this analysis: ${JSON.stringify(originalPathsForTheme)}\nPrompt Parts Sent to AI (contains data URIs corresponding to the paths above):\n${JSON.stringify(styleAnalysisPromptParts, null, 2)}\n`;
        await fs.appendFile(logFilePath, logContent);
        console.log(`DEBUG: Style analysis details (including original paths and data URI prompt) also logged to ${logFilePath}`);
      } catch (logError) {
        console.error("DEBUG: Error logging style analysis details to file:", logError);
      }

      try {
        const styleAnalysisResponse = await ai.generate({
          prompt: styleAnalysisPromptParts,
        });
        styleDescriptionFromReferences = styleAnalysisResponse.text ?? "";
        if (!styleDescriptionFromReferences.trim()) {
            console.warn(`Style analysis for '${themeName}' did not return a description. Using default theme description.`);
            styleDescriptionFromReferences = ""; 
        } else {
            console.log(`Style description for '${themeName}' from references: ${styleDescriptionFromReferences}`);
        }
      } catch (e) {
        console.error("Error during style analysis AI call:", e);
        styleDescriptionFromReferences = ""; 
      }
    }

    // STEP 2: Generate the Final Image
    const finalImagePromptParts: ({text: string} | {media: {url: string}})[] = [];

    let coreInstructions = `**TASK: BACKGROUND REPLACEMENT FOR THE USER PHOTO**

You will be given "THE USER PHOTO". This photo contains a person.
Your primary goal is to:
1.  **IDENTIFY and PRESERVE THE PERSON** in "THE USER PHOTO". This person, including their face, body, clothing, and pose, MUST remain completely unchanged, clear, and visible in the foreground. They are the main subject.
2.  **REPLACE THE EXISTING BACKGROUND** of "THE USER PHOTO" with a new, A.I.-generated background.
3.  This new A.I.-generated background MUST be inspired by the chosen theme: **${input.choice}**.
`;

    if (styleDescriptionFromReferences.trim()) {
      coreInstructions += `\n4.  Furthermore, the new background's style should be heavily influenced by this detailed description derived from reference images: "${styleDescriptionFromReferences}"`;
    } else {
      if (input.choice === 'Code') {
        coreInstructions += `\n4.  The new background for 'Code' should feature clean, futuristic, structured elements, possibly incorporating neon orange (hex #FF8C00) accents. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces.`;
      } else { 
        coreInstructions += `\n4.  The new background for 'Chaos' should feature glitchy, abstract, aggressive elements, possibly incorporating neon yellow (hex #04D9FF) accents. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects.`;
      }
    }
     coreInstructions += `\n\n**CRITICAL RULE: THE PERSON FROM "THE USER PHOTO" MUST NOT BE ALTERED, REPLACED, OR OBSCURED IN ANY WAY. Only their original background is to be replaced with a new A.I.-generated one BEHIND THEM.**`;

    finalImagePromptParts.push({ text: coreInstructions });

    finalImagePromptParts.push({ text: "\n\n**THE USER PHOTO (Identify person, keep them 100% unchanged, replace their background):**" });
    finalImagePromptParts.push({ media: {url: input.photoDataUri} });
    
    finalImagePromptParts.push({
      text: `\n\n**FINAL INSTRUCTION: Generate the image.**
1.  Take the person from "THE USER PHOTO" and ensure they are perfectly preserved and unchanged in the foreground.
2.  Replace their original background with a new A.I.-generated background as described above.
3.  All generated elements MUST ONLY be in this new background, BEHIND the preserved person.
You can also provide a brief text description of the newly generated background and how it incorporates the theme and style references.`
    });

    const {media, text: modelGeneratedText} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: finalImagePromptParts,
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
        transformationDescription = `A new background was generated for the user's photo based on their choice of '${input.choice}' for question #${input.questionNumber}.
It was inspired by ${styleDescriptionFromReferences.trim() ? "an analysis of reference images: "+styleDescriptionFromReferences : "the general '"+input.choice+"' theme"}.
The user in their original photo was intended to be kept clear, prominent, and unchanged in the foreground.`;
    }

    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: transformationDescription,
    };
  }
);
    
