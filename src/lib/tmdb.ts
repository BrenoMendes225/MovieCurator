const BASE_URL = '/api/tmdb';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface WatchProvider {
  logo_path: string;
  provider_name: string;
}

export interface WatchProviders {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  link?: string;
}

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  credits?: {
    cast: { name: string; profile_path?: string; character: string }[];
    crew: { name: string; job: string }[];
  };
  videos?: {
    results: { id: string; key: string; name: string; type: string; site: string }[];
  };
  budget?: number;
  revenue?: number;
  production_companies?: { name: string; logo_path?: string }[];
  spoken_languages?: { english_name: string; name: string }[];
}

const GENRE_MAP: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'Cinema TV',
  53: 'Suspense',
  10752: 'Guerra',
  37: 'Faroeste',
};

import { Movie } from '@/data/movies';

const BANNED_TITLES = ['too many cooks', 'cooks', 'short film', 'special'];

export const mapToMovie = (tmdbMovie: TMDBMovie): Movie => ({
  id: tmdbMovie.id.toString(),
  title: tmdbMovie.title || tmdbMovie.name || 'Sem título',
  type: tmdbMovie.title ? 'movie' : 'series',
  genres: tmdbMovie.genre_ids?.map((id: number) => GENRE_MAP[id]) || tmdbMovie.genres?.map((g) => g.name) || [],
  poster: getImageUrl(tmdbMovie.poster_path),
  backdrop: getImageUrl(tmdbMovie.backdrop_path, 'original'),
  synopsis: tmdbMovie.overview,
  director: tmdbMovie.credits?.crew?.find((c) => c.job === 'Director')?.name || 'Desconhecido',
  cast: tmdbMovie.credits?.cast?.slice(0, 5).map((c) => c.name) || [],
  rating: Math.round(tmdbMovie.vote_average * 10) / 10,
  year: new Date(tmdbMovie.release_date || tmdbMovie.first_air_date || Date.now()).getFullYear(),
});

export const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  const queryParams = new URLSearchParams({
    endpoint,
    ...params,
  });

  const response = await fetch(`${BASE_URL}?${queryParams.toString()}`);
  if (!response.ok) throw new Error('Falha ao buscar dados do TMDB via Proxy');
  return response.json();
};

export const getImageUrl = (path: string, size: 'w500' | 'original' = 'w500') => {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const getTrendingMovies = async () => {
  // Aumentando a aleatoriedade ao buscar trending
  const randomPage = Math.floor(Math.random() * 3) + 1;
  const d = new Date();
  d.setMonth(d.getMonth() - 5);
  const maxDate = d.toISOString().split('T')[0];

  const data = await fetchTMDB('/discover/movie', {
    sort_by: 'popularity.desc',
    page: randomPage.toString(),
    'vote_count.gte': '1000',
    'vote_average.gte': '7.0',
    'primary_release_date.lte': maxDate,
    'with_runtime.gte': '75',
    'with_original_language': 'en|pt|fr|es|it|ja|ko'
  });
  return data.results.filter((m: any) => 
    !BANNED_TITLES.some(banned => m.title?.toLowerCase().includes(banned))
  );
};

export const getMovieDetails = async (id: string): Promise<TMDBMovie> => {
  return fetchTMDB(`/movie/${id}`, { append_to_response: 'videos,credits' });
};

export const searchMovies = async (query: string) => {
  const data = await fetchTMDB('/search/movie', { query });
  return data.results;
};

export const getMoviesByGenre = async (genreId: string) => {
  const data = await fetchTMDB('/discover/movie', { with_genres: genreId });
  return data.results;
};

export const getRandomMovie = async () => {
  // Aumentando para as primeiras 20 páginas (400 filmes) para máxima variedade
  const randomPage = Math.floor(Math.random() * 20) + 1;
  const d = new Date();
  d.setMonth(d.getMonth() - 5);
  const maxDate = d.toISOString().split('T')[0];

  const data = await fetchTMDB('/discover/movie', { 
    page: randomPage.toString(),
    'vote_count.gte': '800', 
    'vote_average.gte': '6.8',
    'primary_release_date.lte': maxDate,
    'with_runtime.gte': '75',
    sort_by: 'popularity.desc'
  });
  
  const validResults = data.results.filter((m: TMDBMovie) => 
    m.poster_path && 
    m.backdrop_path && 
    m.overview && 
    m.overview.trim() !== '' &&
    !BANNED_TITLES.some(banned => m.title?.toLowerCase().includes(banned))
  );
  if (validResults.length === 0) return data.results[0]; // fallback
  
  const randomIndex = Math.floor(Math.random() * validResults.length);
  return validResults[randomIndex];
};

export const getNowPlayingMovies = async () => {
  const data = await fetchTMDB('/movie/now_playing', { region: 'BR' });
  return data.results as TMDBMovie[];
};

export const getWatchProviders = async (id: string) => {
  const data = await fetchTMDB(`/movie/${id}/watch/providers`);
  return (data.results?.BR || null) as WatchProviders | null;
};

export const getGenresList = async () => {
  const data = await fetchTMDB('/genre/movie/list');
  return data.genres as { id: number; name: string }[];
};

const REVERSE_GENRE_MAP: Record<string, number> = Object.entries(GENRE_MAP).reduce(
  (acc, [id, name]) => ({ ...acc, [name]: parseInt(id) }),
  {}
);

export const getDiscoverMovies = async (genres: string[], page = '1', excludeIds: string[] = []) => {
  const genreIds = genres
    .map(name => REVERSE_GENRE_MAP[name])
    .filter(id => !!id);

  const sortOptions = [
    'popularity.desc',
    'vote_average.desc',
    'revenue.desc',
    'primary_release_date.desc'
  ];
  const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];

  const params: Record<string, string> = {
    sort_by: randomSort,
    'vote_count.gte': randomSort === 'vote_average.desc' ? '2000' : '800', 
    'vote_average.gte': '6.5',
    page,
    'primary_release_date.gte': '1970-01-01',
    'primary_release_date.lte': (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5);
      return d.toISOString().split('T')[0];
    })(),
    'with_runtime.gte': '75',
    'with_original_language': 'en|pt|fr|es|it|ja|ko',
  };

  if (genreIds.length > 0) {
    params.with_genres = genreIds.join(',');
  }

  const data = await fetchTMDB('/discover/movie', params);
  let results = data.results as TMDBMovie[];
  
  if (excludeIds.length > 0) {
    results = results.filter(m => !excludeIds.includes(m.id.toString()));
  }

  return results.filter(m => 
    !BANNED_TITLES.some(banned => m.title?.toLowerCase().includes(banned))
  );
};



