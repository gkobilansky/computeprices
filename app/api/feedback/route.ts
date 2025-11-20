import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const validReactions = ['up', 'down'];

export async function POST(request: Request) {
  try {
    const { reaction, details, email, page } = await request.json();

    const trimmedDetails = typeof details === 'string' ? details.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedPage = typeof page === 'string' ? page.slice(0, 200) : null;
    const hasReaction = typeof reaction === 'string' && reaction.length > 0;

    if (!hasReaction && !trimmedDetails) {
      return NextResponse.json(
        { error: 'Please include either a reaction or a short note.' },
        { status: 400 }
      );
    }

    if (hasReaction && !validReactions.includes(reaction)) {
      return NextResponse.json(
        { error: 'reaction must be "up" or "down"' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from('feedback').insert({
      reaction: hasReaction ? reaction : null,
      details: trimmedDetails || null,
      email: trimmedEmail || null,
      page: trimmedPage,
    });

    if (error) {
      console.error('Feedback submission error:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Thanks for letting us know!' });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Unable to process feedback right now.' },
      { status: 500 }
    );
  }
}
