'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/data/movies';
import { getTrendingMovies, mapToMovie } from '@/lib/tmdb';
import Link from 'next/link';
import styles from './shuffler.module.css';

export default function ShufflerPage() {
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [pool, setPool] = useState<Movie[]>([]);

  useEffect(() => {
    const loadPool = async () => {
      const trending = await getTrendingMovies();
      setPool(trending.map(mapToMovie));
    };
    loadPool();
  }, []);

  const handleShuffle = () => {
    setIsShuffling(true);
    setRandomMovie(null);
    
    // Animação de sorteio
    setTimeout(() => {
      const random = pool[Math.floor(Math.random() * pool.length)];
      setRandomMovie(random);
      
      setTimeout(() => {
        setIsShuffling(false);
      }, 1500);
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundBlur} />
      
      <div className={styles.header}>
        <span className={styles.badge}>DÚVIDA CRUEL?</span>
        <h1>Cine<span>Sorteio</span></h1>
        <p>Deixe o destino escolher sua próxima experiência cinematográfica.</p>
      </div>

      <div className={styles.shufflerContainer}>
        <div className={styles.slotMachine}>
          <div className={`${styles.display} ${isShuffling ? styles.isShuffling : ''}`}>
            {isShuffling ? (
              <div className={styles.reel}>
                {pool.slice(0, 10).map((m, i) => (
                  <img key={i} src={m.poster} alt="" className={styles.reelImg} />
                ))}
              </div>
            ) : randomMovie ? (
              <div className={styles.resultContainer}>
                <div className={styles.posterWrapper}>
                  <img src={randomMovie.poster} alt={randomMovie.title} />
                  <div className={styles.ratingBadge}>★ {randomMovie.rating}</div>
                </div>
                <div className={styles.resultInfo}>
                  <span className={styles.matchTag}>SEU FILME DE HOJE</span>
                  <h2>{randomMovie.title}</h2>
                  <p>{randomMovie.genres.join(' • ')}</p>
                  <Link href={`/movie/${randomMovie.id}`} className={styles.viewBtn}>
                    VER DETALHES
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.placeholder}>
                <div className={styles.questionMark}>?</div>
                <p>PRONTO PARA O SORTEIO?</p>
              </div>
            )}
          </div>
        </div>

        <button 
          className={styles.shuffleBtn} 
          onClick={handleShuffle}
          disabled={isShuffling || pool.length === 0}
        >
          <span className={styles.btnIcon}>🎲</span>
          {isShuffling ? 'ESCOLHENDO...' : 'SORTEAR AGORA'}
        </button>
      </div>
    </div>
  );
}
