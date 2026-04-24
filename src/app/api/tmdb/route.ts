import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  // Copy search params and remove 'endpoint'
  const params = new URLSearchParams(searchParams);
  params.delete('endpoint');
  params.set('api_key', TMDB_API_KEY || '');
  params.set('language', 'pt-BR');

  try {
    const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('TMDB Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
  }
}
