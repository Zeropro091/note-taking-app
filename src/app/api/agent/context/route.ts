import { NextResponse } from 'next/server';
import { getAgentContext } from '@/lib/agent-context';

export const runtime = 'nodejs';

/**
 * GET /api/agent/context
 * Returns a condensed, high-signal JSON map of the entire knowledge base.
 * Optimized for AI agent RAG consumption.
 */
export async function GET() {
  try {
    const context = await getAgentContext();
    return NextResponse.json({
      success: true,
      context
    });
  } catch (error) {
    console.error('Error generating agent context:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate context' },
      { status: 500 }
    );
  }
}
