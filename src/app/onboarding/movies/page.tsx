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
  const [saving, setSaving] = useState(false);
  const { addToWatchlist } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchMovies = async () => {
      const raw = sessionStorage.getItem('onboarding_genre_ids');

      if (!raw) {
        router.replace('/onboarding');
        return;
      }

      try {
        const genreIds = JSON.parse(raw) as number[];
        // Buscar de múltiplas páginas para mais variedade
        const [page1, page2] = await Promise.all([
          getDiscoverMovies(genreIds.map(String)),
          getDiscoverMovies(genreIds.map(String)),
        ]);

        const combined = [...page1, ...page2];
        // Deduplicar por ID
        const unique = combined.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
        setMovies(unique.slice(0, 20).map(mapToMovie));
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
      setSelectedIds(selectedIds.filter(id => id !== movie.id));
    } else {
      if (selectedIds.length < 5) {
        setSelectedIds([...selectedIds, movie.id]);
      }
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const selected = movies.filter(m => selectedIds.includes(m.id));
      if (selected.length > 0) {
        await Promise.all(selected.map(m => addToWatchlist(m)));
      }
      sessionStorage.removeItem('onboarding_genre_ids');
      router.push('/discover');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      router.push('/discover');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingDots}>
          <span /><span /><span />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.stepIndicator}>
        <div className={styles.step}>1</div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${styles.stepActive}`}>2</div>
      </div>

      <h1 className={`${styles.title} animate-fade-in`}>
        Agora, escolha seus <span>favoritos</span>
      </h1>
      <p className={`${styles.description} animate-fade-in`}>
        Selecione até <strong>5 filmes</strong> que você já viu e gostou. Isso treina nossas recomendações.
      </p>

      <div className={`${styles.movieGrid} animate-fade-in`}>
        {movies.map((movie) => {
          const isSelected = selectedIds.includes(movie.id);
          const isLocked = !isSelected && selectedIds.length >= 5;
          return (
            <div
              key={movie.id}
              className={`${styles.movieCard} ${isSelected ? styles.selected : ''} ${isLocked ? styles.locked : ''}`}
              onClick={() => !isLocked && toggleMovie(movie)}
            >
              <img src={movie.poster} alt={movie.title} loading="lazy" />
              <div className={styles.movieOverlay}>
                <span className={styles.movieTitle}>{movie.title}</span>
                <span className={styles.movieYear}>{movie.year}</span>
              </div>
              {isSelected && <div className={styles.selectedBadge}>✓</div>}
            </div>
          );
        })}
      </div>

      <div className={styles.bottomBar}>
        <span className={styles.selectionInfo}>
          {selectedIds.length === 0
            ? 'Escolha até 5 filmes (opcional)'
            : `${selectedIds.length}/5 selecionados`}
        </span>
        <button
          className={styles.nextBtn}
          onClick={handleFinish}
          disabled={saving}
        >
          {saving ? 'Entrando...' : selectedIds.length > 0 ? 'Entrar no App →' : 'Pular →'}
        </button>
      </div>
    </div>
  );
}
