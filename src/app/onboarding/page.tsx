'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { getGenresList } from '@/lib/tmdb';
import styles from './onboarding.module.css';

const GENRE_EMOJIS: Record<string, string> = {
  'Action': '⚡', 'Ação': '⚡',
  'Comedy': '😄', 'Comédia': '😄',
  'Drama': '🎭',
  'Horror': '👻', 'Terror': '👻',
  'Science Fiction': '🚀', 'Ficção Científica': '🚀',
  'Animation': '✨', 'Animação': '✨',
  'Thriller': '🔪', 'Suspense': '🔪',
  'Romance': '💘',
  'Crime': '🕵️',
  'Adventure': '🗺️', 'Aventura': '🗺️',
  'Fantasy': '🧙', 'Fantasia': '🧙',
  'Documentary': '📽️', 'Documentário': '📽️',
  'Music': '🎵', 'Música': '🎵',
  'History': '📜', 'História': '📜',
  'War': '⚔️', 'Guerra': '⚔️',
  'Western': '🤠', 'Faroeste': '🤠',
  'Mystery': '🔍', 'Mistério': '🔍',
  'Family': '👨‍👩‍👧', 'Família': '👨‍👩‍👧',
};

export default function GenreSelection() {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { setUserGenres } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const list = await getGenresList();
        setGenres(list);
      } catch (error) {
        console.error('Erro ao carregar gêneros:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGenres();
  }, []);

  const toggleGenre = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (selectedIds.length < 3 || saving) return;
    setSaving(true);

    const selectedNames = genres
      .filter(g => selectedIds.includes(g.id))
      .map(g => g.name);

    sessionStorage.setItem('onboarding_genre_ids', JSON.stringify(selectedIds));
    await setUserGenres(selectedNames);
    router.push('/onboarding/movies');
  };

  const canProceed = selectedIds.length >= 3;

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
        <div className={`${styles.step} ${styles.stepActive}`}>1</div>
        <div className={`${styles.stepLine} ${styles.stepLineActive}`} />
        <div className={styles.step}>2</div>
      </div>

      <h1 className={`${styles.title} animate-fade-in`}>
        O que você gosta de <span>assistir?</span>
      </h1>
      <p className={`${styles.description} animate-fade-in`}>
        Escolha <strong>pelo menos 3 gêneros</strong>. Usaremos isso para montar a sua experiência pessoal.
      </p>

      <div className={`${styles.genreGrid} animate-fade-in`}>
        {(genres || []).map((genre) => {
          const isSelected = selectedIds.includes(genre.id);
          const emoji = GENRE_EMOJIS[genre.name] || '🎬';
          return (
            <div
              key={genre.id}
              className={`${styles.genreCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => toggleGenre(genre.id)}
            >
              <span className={styles.genreEmoji}>{emoji}</span>
              <span className={styles.genreName}>{genre.name}</span>
              {isSelected && <div className={styles.checkMark}>✓</div>}
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      {selectedIds.length >= 1 && (
        <div className={styles.bottomBar}>
          <div className={styles.progressInfo}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min((selectedIds.length / 3) * 100, 100)}%` }}
              />
            </div>
            <span className={styles.selectionInfo}>
              {!canProceed
                ? `Faltam ${3 - selectedIds.length} gênero${3 - selectedIds.length !== 1 ? 's' : ''} para continuar`
                : `${selectedIds.length} gêneros selecionados ✓`}
            </span>
          </div>

          <button
            className={`${styles.nextBtn} ${canProceed ? styles.nextBtnReady : styles.nextBtnWaiting}`}
            onClick={handleNext}
            disabled={!canProceed || saving}
          >
            {saving ? (
              <span className={styles.btnLoading}><span /><span /><span /></span>
            ) : (
              <>Próxima Etapa <span className={styles.btnArrow}>→</span></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
