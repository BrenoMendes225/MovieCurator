'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { getGenresList } from '@/lib/tmdb';
import styles from './onboarding.module.css';

const GENRE_EMOJIS: Record<string, string> = {
  'Action': '⚡', 'Ação': '⚡',
  'Comedy': '😄', 'Comédia': '😄',
  'Drama': '🎭', 'Drama': '🎭',
  'Horror': '👻', 'Terror': '👻',
  'Science Fiction': '🚀', 'Ficção Científica': '🚀',
  'Animation': '✨', 'Animação': '✨',
  'Thriller': '🔪', 'Suspense': '🔪',
  'Romance': '💘', 'Romance': '💘',
  'Crime': '🕵️', 'Crime': '🕵️',
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
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(g => g !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleNext = async () => {
    if (selectedIds.length < 3) return;
    setSaving(true);

    const selectedNames = genres
      .filter(g => selectedIds.includes(g.id))
      .map(g => g.name);

    await setUserGenres(selectedNames);
    // Salvar IDs para a próxima etapa
    sessionStorage.setItem('onboarding_genre_ids', JSON.stringify(selectedIds));
    router.push('/onboarding/movies');
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
        <div className={`${styles.step} ${styles.stepActive}`}>1</div>
        <div className={styles.stepLine} />
        <div className={styles.step}>2</div>
      </div>

      <h1 className={`${styles.title} animate-fade-in`}>
        O que você gosta de <span>assistir?</span>
      </h1>
      <p className={`${styles.description} animate-fade-in`}>
        Escolha pelo menos 3 gêneros. Usaremos isso para montar sua experiência pessoal.
      </p>

      <div className={`${styles.genreGrid} animate-fade-in`}>
        {genres.map((genre) => {
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

      <div className={styles.bottomBar}>
        <span className={styles.selectionInfo}>
          {selectedIds.length < 3
            ? `Selecione mais ${3 - selectedIds.length} gênero${3 - selectedIds.length !== 1 ? 's' : ''}`
            : `${selectedIds.length} gêneros escolhidos ✓`}
        </span>
        <button
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={selectedIds.length < 3 || saving}
        >
          {saving ? 'Salvando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}
