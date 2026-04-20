'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { getGenresList } from '@/lib/tmdb';
import styles from './onboarding.module.css';

export default function GenreSelection() {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
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
      setSelectedIds(selectedIds.filter((g) => g !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleNext = async () => {
    if (selectedIds.length >= 3) {
      // Passar IDs para a próxima tela via URL ou estado global (usaremos string de nomes para o UserContext por enquanto para compatibilidade)
      const selectedNames = genres
        .filter(g => selectedIds.includes(g.id))
        .map(g => g.name);
      
      await setUserGenres(selectedNames);
      // Armazenar IDs no sessionStorage para a próxima tela de filmes
      sessionStorage.setItem('onboarding_genre_ids', JSON.stringify(selectedIds));
      router.push('/onboarding/movies');
    }
  };

  if (loading) return <div className={styles.container}>Carregando o catálogo...</div>;

  return (
    <div className={styles.container}>
      <h1 className={`${styles.title} animate-fade-in`}>O que você gosta de <span>assistir?</span></h1>
      <p className={`${styles.description} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
        Selecione pelo menos 3 gêneros. Isso nos ajuda a entender seu gosto cinematográfico.
      </p>
      
      <div className={`${styles.genreGrid} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
        {genres.map((genre) => (
          <div 
            key={genre.id} 
            className={`${styles.genreCard} ${selectedIds.includes(genre.id) ? styles.selected : ''}`}
            onClick={() => toggleGenre(genre.id)}
          >
            <span className={styles.genreName}>{genre.name.toUpperCase()}</span>
            {selectedIds.includes(genre.id) && <div className={styles.checkMark}>✓</div>}
          </div>
        ))}
      </div>

      <button 
        className={`${styles.nextBtn} animate-fade-in`} 
        style={{ animationDelay: '0.4s' }}
        onClick={handleNext}
        disabled={selectedIds.length < 3}
      >
        {selectedIds.length < 3 ? `Selecione mais ${3 - selectedIds.length}` : 'Continuar'}
      </button>
    </div>
  );
}
