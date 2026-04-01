import RunwayML from '@runwayml/sdk';

let runwayClient: RunwayML | null = null;

export function getRunwayClient() {
  const secret = process.env.RUNWAYML_API_SECRET;

  if (!secret) {
    throw new Error('Missing RUNWAYML_API_SECRET. Add it to your environment before starting the app.');
  }

  if (!runwayClient) {
    runwayClient = new RunwayML({ apiKey: secret });
  }

  return runwayClient;
}
