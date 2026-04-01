export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getRunwayClient } from '@/lib/runway';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const client = getRunwayClient();
    const task = await client.tasks.retrieve(id);

    const output = Array.isArray(task.output) && task.output.length > 0 ? String(task.output[0]) : null;

    return NextResponse.json({
      id: task.id,
      status: task.status,
      output,
      failureCode: 'failureCode' in task ? task.failureCode ?? null : null,
      failureMessage: 'failureMessage' in task ? task.failureMessage ?? null : null,
      createdAt: task.createdAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch task.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
