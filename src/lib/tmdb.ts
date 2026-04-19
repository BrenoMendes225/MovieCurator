const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

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
    results: { key: string; type: string; site: string }[];
  };
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
  const data = await fetchTMDB('/trending/movie/week');
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
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const data = await fetchTMDB('/discover/movie', { page: randomPage.toString() });
  const randomIndex = Math.floor(Math.random() * data.results.length);
  return data.results[randomIndex];
};
