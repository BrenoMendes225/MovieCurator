'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { getDiscoverMovies, mapToMovie } from '@/lib/tmdb';
import { Movie } from '@/data/movies';
import styles from '../onboarding.module.css';

export default function MovieSelection() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToWatchlist } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchMovies = async () => {
      const genreIdsRaw = sessionStorage.getItem('onboarding_genre_ids');
      if (!genreIdsRaw) {
        router.push('/onboarding');
        return;
      }

      try {
        const genreIds = JSON.parse(genreIdsRaw);
        const results = await getDiscoverMovies(genreIds);
        setMovies(results.map(mapToMovie));
      } catch (error) {
        console.error('Erro ao carregar filmes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [router]);

  const toggleMovie = (movie: Movie) => {
    if (selectedIds.includes(movie.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== movie.id));
    } else {
      if (selectedIds.length < 5) {
        setSelectedIds([...selectedIds, movie.id]);
      }
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Adicionar os filmes selecionados à watchlist
      const selectedFullMovies = movies.filter(m => selectedIds.includes(m.id));
      await Promise.all(selectedFullMovies.map(m => addToWatchlist(m)));
      
      sessionStorage.removeItem('onboarding_genre_ids');
      router.push('/discover');
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
      router.push('/discover');
    }
  };

  if (loading && movies.length === 0) return <div className={styles.container}>Preparando suas recomendações...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.selectionCount}>
        {selectedIds.length} / 5 SELECIONADOS
      </div>

      <h1 className={`${styles.title} animate-fade-in`}>Agora, escolha seus <span>favoritos</span></h1>
      <p className={`${styles.description} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
        Selecione até 5 filmes que você gosta. Isso nos ajuda a calibrar sua experiência.
      </p>
      
      <div className={`${styles.movieGrid} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
        {movies.map((movie) => (
          <div 
            key={movie.id} 
            className={`${styles.movieCard} ${selectedIds.includes(movie.id) ? styles.selected : ''}`}
            onClick={() => toggleMovie(movie)}
          >
            <img src={movie.poster} alt={movie.title} />
            <div className={styles.movieOverlay}>
              <span className={styles.movieTitle}>{movie.title.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>

      <button 
        className={`${styles.nextBtn} animate-fade-in`} 
        style={{ animationDelay: '0.4s', backgroundColor: selectedIds.length > 0 ? '#b066fe' : 'white', color: selectedIds.length > 0 ? 'white' : 'black' }}
        onClick={handleFinish}
        disabled={loading}
      >
        {loading ? 'SALVANDO...' : 'Finalizar Configuração'}
      </button>
    </div>
  );
}
