'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { getDiscoverMovies, mapToMovie } from '@/lib/tmdb';
import { Movie } from '@/data/movies';
import styles from '../onboarding.module.css';

const REQUIRED = 5;
const TOTAL_SHOWN = 10;

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
        const results = await getDiscoverMovies(genreIds.map(String));
        // Pegar os 10 mais populares com poster
        const valid = results
          .filter(m => m.poster_path)
          .slice(0, TOTAL_SHOWN)
          .map(mapToMovie);
        setMovies(valid);
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
      setSelectedIds(prev => prev.filter(id => id !== movie.id));
    } else if (selectedIds.length < REQUIRED) {
      setSelectedIds(prev => [...prev, movie.id]);
    }
  };

  const handleFinish = async () => {
    if (selectedIds.length < REQUIRED || saving) return;
    setSaving(true);

    try {
      const selected = movies.filter(m => selectedIds.includes(m.id));
      await Promise.all(selected.map(m => addToWatchlist(m)));
      sessionStorage.removeItem('onboarding_genre_ids');
      router.push('/discover');
    } catch {
      router.push('/discover');
    }
  };

  const canFinish = selectedIds.length === REQUIRED;

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
      {/* Step indicator */}
      <div className={styles.stepIndicator}>
        <div className={styles.step}>1</div>
        <div className={`${styles.stepLine} ${styles.stepLineActive}`} />
        <div className={`${styles.step} ${styles.stepActive}`}>2</div>
      </div>

      <h1 className={`${styles.title} animate-fade-in`}>
        Escolha seus <span>{REQUIRED} favoritos</span>
      </h1>
      <p className={`${styles.description} animate-fade-in`}>
        Dos filmes abaixo, selecione exatamente <strong>{REQUIRED}</strong> que você já assistiu ou quer assistir.
        Isso personaliza toda a sua experiência.
      </p>

      {/* Movie grid — exatamente 10 filmes */}
      <div className={`${styles.movieGrid} animate-fade-in`}>
        {movies.map((movie) => {
          const isSelected = selectedIds.includes(movie.id);
          const isLocked = !isSelected && selectedIds.length >= REQUIRED;
          const rank = selectedIds.indexOf(movie.id) + 1;

          return (
            <div
              key={movie.id}
              className={`${styles.movieCard} ${isSelected ? styles.selected : ''} ${isLocked ? styles.locked : ''}`}
              onClick={() => toggleMovie(movie)}
            >
              <img src={movie.poster} alt={movie.title} loading="lazy" />
              <div className={styles.movieOverlay}>
                <span className={styles.movieTitle}>{movie.title}</span>
                <span className={styles.movieYear}>{movie.year}</span>
              </div>
              {isSelected && (
                <div className={styles.selectedBadge}>{rank}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className={styles.progressInfo}>
          {/* 5 dots indicando os filmes escolhidos */}
          <div className={styles.dotTracker}>
            {Array.from({ length: REQUIRED }).map((_, i) => (
              <div
                key={i}
                className={`${styles.dot} ${i < selectedIds.length ? styles.dotFilled : ''}`}
              />
            ))}
          </div>
          <span className={styles.selectionInfo}>
            {!canFinish
              ? `Escolha mais ${REQUIRED - selectedIds.length} filme${REQUIRED - selectedIds.length !== 1 ? 's' : ''}`
              : 'Tudo pronto! 🎬'}
          </span>
        </div>

        <button
          className={`${styles.nextBtn} ${canFinish ? styles.nextBtnReady : ''}`}
          onClick={handleFinish}
          disabled={!canFinish || saving}
        >
          {saving ? (
            <span className={styles.btnLoading}><span /><span /><span /></span>
          ) : (
            <>Entrar no App <span className={styles.btnArrow}>🚀</span></>
          )}
        </button>
      </div>
    </div>
  );
}
