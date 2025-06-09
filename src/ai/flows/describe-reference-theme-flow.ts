
'use server';
/**
 * @fileOverview A Genkit flow to generate a textual description of a single reference image.
 * This flow is intended to be run manually for each reference image to pre-generate
 * descriptions that can be used by other flows.
 *
 * - describeReferenceTheme - Generates a description for a single image.
 * - DescribeReferenceThemeInput - Input schema for the flow.
 * - DescribeReferenceThemeOutput - Output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DescribeReferenceThemeInputSchema = z.object({
  referenceImageUri: z
    .string()
    .describe(
      "A single reference image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribeReferenceThemeInput = z.infer<typeof DescribeReferenceThemeInputSchema>;

export const DescribeReferenceThemeOutputSchema = z.object({
  description: z.string().describe('A detailed textual description of the image, focusing on objects, props, and thematic elements.'),
});
export type DescribeReferenceThemeOutput = z.infer<typeof DescribeReferenceThemeOutputSchema>;

export async function describeReferenceTheme(input: DescribeReferenceThemeInput): Promise<DescribeReferenceThemeOutput> {
  return describeReferenceThemeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describeReferenceThemePrompt',
  input: {schema: DescribeReferenceThemeInputSchema},
  output: {schema: DescribeReferenceThemeOutputSchema},
  prompt: `Analyze the following image. Describe in detail the specific objects, props, items, and distinct visual elements (e.g., robots, futuristic guns, specific machinery, energy effects, particular patterns) that are present.
Also, briefly note the overall artistic style if it's very prominent (e.g., '80s retro-futuristic', 'cyberpunk').
Focus on elements that could be incorporated into a new, visually rich background. Do not describe any people in the image.

Image for analysis:
{{media url=referenceImageUri}}`,
});

const describeReferenceThemeFlow = ai.defineFlow(
  {
    name: 'describeReferenceThemeFlow',
    inputSchema: DescribeReferenceThemeInputSchema,
    outputSchema: DescribeReferenceThemeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
