'use client';

import { useEffect, useState } from 'react';
import { getNowPlayingMovies, mapToMovie } from '@/lib/tmdb';
import { Movie } from '@/data/movies';
import Link from 'next/link';
import styles from './in-theaters.module.css';

export default function InTheatersPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const data = await getNowPlayingMovies();
        const mapped = data
          .filter(m => m.poster_path && m.backdrop_path && m.overview)
          .map(mapToMovie);
        setMovies(mapped);
      } catch (error) {
        console.error('Error fetching in-theaters movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Buscando filmes em cartaz...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Nos Cinemas</h1>
        <p>Descubra as novidades que estão passando nas telonas agora.</p>
      </div>

      <div className={styles.movieGrid}>
        {movies.map(movie => (
          <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard}>
            <div className={styles.posterWrapper}>
              <img src={movie.poster} alt={movie.title} />
              <div className={styles.ratingBadge}>★ {movie.rating}</div>
            </div>
            <div className={styles.movieInfo}>
              <h3>{movie.title}</h3>
              <p>{(movie.genres[0] || 'FILME').toUpperCase()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
