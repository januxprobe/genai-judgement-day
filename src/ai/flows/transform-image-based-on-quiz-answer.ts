
'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers and a pre-generated theme description.
 * This flow uses a pre-generated description of reference themes to guide an image generation model
 * to create a new background while preserving the user. Transformations are intended to be additive.
 *
 * - transformImage - A function that transforms the image based on quiz choices and a theme description.
 * - TransformImageInput - The input type for the transformImage function.
 * - TransformImageOutput - The return type for the transformImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransformImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user (THE USER PHOTO), potentially already modified by previous steps, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  choice: z.enum(['Code', 'Chaos']).describe('The user\'s choice for the current question.'),
  questionNumber: z.number().describe('The question number in the quiz.'),
  referenceThemeDescription: z.string().optional().describe(
    "A pre-generated textual description of the chosen theme's reference elements, objects, props, and overall style for the current question. This description is derived from analyzing one or more reference images for the theme."
  ),
});
export type TransformImageInput = z.infer<typeof TransformImageInputSchema>;

const TransformImageOutputSchema = z.object({
  transformedPhotoDataUri: z
    .string()
    .describe("The transformed photo of the user, as a data URI."),
  transformationDescription: z.string().describe('A description of the transformation applied, focusing on elements added to the background.'),
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
  async (input) => {
    const themeName = input.choice;
    const finalImagePromptParts: ({text: string} | {media: {url: string}})[] = [];

    let coreInstructions = `**TASK: EVOLVE THE USER'S BACKGROUND ADDITIVELY**

You will be given "THE USER PHOTO". This photo contains a person, and its background may have been modified by previous choices.
Your primary goals are to:
1.  **IDENTIFY and PRESERVE THE PERSON** in "THE USER PHOTO". This person, including their face, body, clothing, and pose, MUST remain completely unchanged, clear, and visible in the foreground. They are the main subject. Any changes should ONLY happen in the background BEHIND them.
2.  **SUBTLY EVOLVE and ENHANCE THE EXISTING BACKGROUND** of "THE USER PHOTO". Do NOT completely replace the background unless this is the very first transformation (question 1). Instead, integrate new elements and styles inspired by the current theme description *into the existing background*. Changes should be additive.
3.  The new elements and stylistic adjustments in the background MUST be inspired by the chosen theme: **${themeName}**. If the theme description mentions robots, droids, creatures, or specific characters, these should appear AS PART OF THE BACKGROUND SCENERY (e.g., walking in the distance, part of machinery, flying by) and should NOT be a transformation of the user themselves, unless the user's original photo already depicted them as such.
`;

    if (input.referenceThemeDescription && input.referenceThemeDescription.trim()) {
      coreInstructions += `\n4.  Furthermore, the new background's style and content should be heavily influenced by this detailed description derived from an analysis of reference images for the '${themeName}' theme for question #${input.questionNumber}: "${input.referenceThemeDescription}". Focus on incorporating these elements additively to what's already in the background. Imagine you are adding a new layer of detail or a new set of objects to an existing scene. For example, if the description mentions robots, add robots into the background environment.`;
      console.log(`Using pre-generated reference description for '${themeName}' (Question ${input.questionNumber}): ${input.referenceThemeDescription}`);
    } else {
      // Fallback descriptions
      if (themeName === 'Code') {
        coreInstructions += `\n4.  The background evolution for 'Code' should add clean, futuristic, structured elements, possibly incorporating neon orange (hex #FF8C00) accents. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces appearing within the existing environment. Add some robots or drones to the background scenery.`;
      } else { // Chaos
        coreInstructions += `\n4.  The background evolution for 'Chaos' should add glitchy, abstract, aggressive elements, possibly incorporating neon yellow (hex #04D9FF) accents. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects appearing within the existing environment. Add some damaged or rogue robots to the background scenery.`;
      }
      console.log(`No pre-generated reference description provided for '${themeName}' (Question ${input.questionNumber}). Using default theme description with focus on background robots.`);
    }
     coreInstructions += `\n\n**CRITICAL RULES:**
*   **THE PERSON FROM "THE USER PHOTO" MUST NOT BE ALTERED, REPLACED, OR OBSCURED IN ANY WAY.** They are an observer or participant, not the subject of transformation.
*   **CHANGES ARE ADDITIVE TO THE BACKGROUND:** The goal is to evolve the background, not discard previous changes entirely. New thematic elements should integrate with what's already there.
*   **ROBOTS/CHARACTERS IN BACKGROUND:** If the theme suggests robots or other characters, they should be depicted as part of the background environment, not as a transformation of the user. For instance, show robots walking in the distance, flying by, or integrated into the scenery.`;

    finalImagePromptParts.push({ text: coreInstructions });

    finalImagePromptParts.push({ text: "\n\n**THE USER PHOTO (Identify person, keep them 100% unchanged, EVOLVE their background additively based on the instructions above):**" });
    finalImagePromptParts.push({ media: {url: input.photoDataUri} });
    
    finalImagePromptParts.push({
      text: `\n\n**FINAL INSTRUCTION: Generate the image.**
1.  Take the person from "THE USER PHOTO" and ensure they are perfectly preserved and unchanged in the foreground.
2.  **Evolve their existing background** by additively incorporating new elements and styles as described above, inspired by the '${themeName}' theme and the provided current step description. Ensure robots or other characters described are part of the background, not a change to the user.
3.  All generated elements MUST ONLY be in this evolving background, BEHIND the preserved person.
Provide a brief text description of the newly generated background, focusing on what new elements were added and how they incorporate the theme and object/style references from the current step.`
    });

    console.log("DEBUG: Final Image Generation - Prompt Parts being sent to AI (contains data URIs):", JSON.stringify(finalImagePromptParts, null, 2));

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
      transformedPhotoDataUri = input.photoDataUri; // Fallback to previous image
      transformationDescription = "AI image generation failed to return a new image. Displaying the previous image state.";
    } else if (!transformationDescription || transformationDescription.trim() === "") {
        transformationDescription = `The background of the user's photo was further evolved based on their choice of '${input.choice}' for question #${input.questionNumber}.
New elements inspired by ${input.referenceThemeDescription && input.referenceThemeDescription.trim() ? "the theme description: \""+input.referenceThemeDescription.substring(0,100)+"...\"" : "the general '"+input.choice+"' theme (focusing on background robots/elements)"} were intended to be added.
The user in their original photo was intended to be kept clear, prominent, and unchanged in the foreground.`;
    }

    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: transformationDescription,
    };
  }
);

