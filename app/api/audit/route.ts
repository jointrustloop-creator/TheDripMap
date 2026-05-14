import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Audit New York Jet Lag
  const { data: sf, error: sfErr } = await supabase
    .from('providers')
    .select('id, name, city, state, description')
    .ilike('city', '%New York%')
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(10);

  return NextResponse.json({
    newYorkSample: sf,
    error: sfErr
  });
}
