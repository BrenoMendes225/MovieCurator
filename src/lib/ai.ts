export async function getAIRecommendations(genres: string[], favoriteMovies: string[]) {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ genres, favoriteMovies })
    });

    if (!response.ok) {
      console.error('AI Proxy error');
      return [];
    }

    const data = await response.json();
    return data.titles || [];
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return [];
  }
}
