export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getRunwayClient } from '@/lib/runway';

const ALLOWED_RATIOS = new Set(['1280:720', '720:1280', '1104:832', '832:1104']);
const ALLOWED_DURATIONS = new Set([5, 10]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = String(body.prompt ?? '').trim();
    const ratio = String(body.ratio ?? '1280:720');
    const duration = Number(body.duration ?? 5);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    if (!ALLOWED_RATIOS.has(ratio)) {
      return NextResponse.json({ error: 'Unsupported ratio.' }, { status: 400 });
    }

    if (!ALLOWED_DURATIONS.has(duration)) {
      return NextResponse.json({ error: 'Duration must be 5 or 10 seconds.' }, { status: 400 });
    }

    const client = getRunwayClient();
    const task = await client.imageToVideo.create({
      model: 'gen4.5',
      promptText: prompt,
      ratio,
      duration
    });

    return NextResponse.json({
      taskId: task.id,
      status: 'PENDING'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start generation.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
