import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { genres, favoriteMovies } = body;

    const prompt = `Você é um curador de cinema de elite com gosto refinado. 
Com base nos gêneros favoritos: ${genres.join(', ')}
E nos filmes que o usuário gosta: ${favoriteMovies.join(', ')}

Sua missão é recomendar 10 filmes que proporcionem uma experiência ÚNICA e PERSONALIZADA.
Regras de Ouro:
1. Misture 4 clássicos absolutos do gênero com 6 "pérolas escondidas" (filmes aclamados mas menos óbvios).
2. Evite recomendar apenas os blockbusters mais famosos que todos já conhecem.
3. Garanta que a lista mude significativamente com base nos interesses específicos.
4. Retorne APENAS uma lista de nomes de filmes separados por vírgula.
5. Sem explicações, sem introduções.
6. Não inclua filmes dos favoritos.

Exemplo de tom: Se o usuário gosta de "Interstellar", não recomende apenas "Inception"; recomende "Arrival" ou "Sunshine".`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return NextResponse.json({ error: 'AI service error' }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Clean and split into array
    const titles = content.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    
    return NextResponse.json({ titles });
  } catch (error) {
    console.error('AI Proxy Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
