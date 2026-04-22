const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
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
    api_key: API_KEY || '',
    language: 'pt-BR',
    ...params,
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
  if (!response.ok) throw new Error('Falha ao buscar dados do TMDB');
  return response.json();
};

export const getImageUrl = (path: string, size: 'w500' | 'original' = 'w500') => {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const getTrendingMovies = async () => {
  // Use discover instead of trending to strictly filter out movies in theaters (recent 4 months)
  const d = new Date();
  d.setMonth(d.getMonth() - 4);
  const maxDate = d.toISOString().split('T')[0];

  const data = await fetchTMDB('/discover/movie', {
    sort_by: 'popularity.desc',
    'vote_count.gte': '300',
    'primary_release_date.lte': maxDate,
    'with_runtime.gte': '60'
  });
  return data.results;
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
  const data = await fetchTMDB('/discover/movie', { 
    page: randomPage.toString(),
    'vote_count.gte': '500', // Apenas filmes com relevância
    sort_by: 'popularity.desc'
  });
  
  const validResults = data.results.filter((m: TMDBMovie) => m.poster_path && m.backdrop_path && m.overview && m.overview.trim() !== '');
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

  const params: Record<string, string> = {
    sort_by: 'popularity.desc',
    'vote_count.gte': '500',
    'vote_average.gte': '6.5',
    page,
    'primary_release_date.gte': '2000-01-01',
    'primary_release_date.lte': (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 4);
      return d.toISOString().split('T')[0];
    })(), // Exclui filmes dos últimos 4 meses (geralmente ainda em cartaz)
    'with_runtime.gte': '60', // Remove curtas e especiais (como Too Many Cooks)
  };

  if (genreIds.length > 0) {
    params.with_genres = genreIds.join(',');
  }

  const data = await fetchTMDB('/discover/movie', params);
  let results = data.results as TMDBMovie[];
  
  if (excludeIds.length > 0) {
    results = results.filter(m => !excludeIds.includes(m.id.toString()));
  }

  return results;
};



