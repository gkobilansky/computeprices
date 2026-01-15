import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const { email, source = 'newsletter' } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Insert the email into the users table using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          email,
          source,
          subscribed_to_newsletter: true,
          // If the record already exists, only update these fields:
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'email',
          returning: 'minimal' // Don't return the record
        }
      );

    if (error) {
      console.error('Newsletter signup error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Handle duplicate email more gracefully
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'You\'re already subscribed, thank you!' },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to sign up for newsletter', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Successfully signed up for newsletter' 
    });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}