const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

export async function getAIRecommendations(genres: string[], favoriteMovies: string[]) {
  try {
    const prompt = `Você é um curador de cinema de elite. 
Com base nos gêneros favoritos: ${genres.join(', ')}
E nos filmes que o usuário gosta: ${favoriteMovies.join(', ')}

Recomende 10 filmes que sejam OBRIGATÓRIOS para este usuário.
Regras:
1. Retorne APENAS uma lista de nomes de filmes separados por vírgula.
2. Não inclua datas, explicações ou saudações.
3. Foque em filmes aclamados (IMDb 7.5+) e que combinem com o perfil.
4. Não inclua os filmes que já estão na lista de favoritos.
5. Evite filmes que ainda estão no cinema em 2026.

Exemplo de resposta: Inception, The Godfather, Parasite`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', await response.text());
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Limpar e transformar em array
    return content.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return [];
  }
}
