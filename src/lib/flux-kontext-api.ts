
import axios from 'axios';

const BFL_API_KEY = process.env.BFL_API_KEY;
const API_URL = 'https://api.bfl.ai/v1';

if (!BFL_API_KEY) {
  throw new Error('BFL_API_KEY is not set');
}

export async function createKontextRequest(prompt: string, input_image: string): Promise<string> {
  const response = await axios.post(
    `${API_URL}/flux-kontext-pro`,
    {
      prompt,
      input_image,
    },
    {
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`Failed to create Kontext request: ${response.statusText}`);
  }

  return response.data.id;
}

export async function pollKontextResult(requestId: string): Promise<string> {
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // wait for 1.5 seconds

    const response = await axios.get(`${API_URL}/get_result?id=${requestId}`, {
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to poll Kontext result: ${response.statusText}`);
    }

    const status = response.data.status;
    if (status === 'Ready') {
      return response.data.result.sample;
    } else if (status !== 'Processing' && status !== 'Queued') {
      throw new Error(`Unexpected status: ${status}`);
    }
  }
}
