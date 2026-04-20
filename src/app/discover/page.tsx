'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Movie } from '@/data/movies';
import { getTrendingMovies, mapToMovie, getDiscoverMovies } from '@/lib/tmdb';
import Link from 'next/link';
import styles from './discover.module.css';

export default function DiscoverPage() {
  const { userGenres, watchlist, addToWatchlist, removeFromWatchlist } = useUser();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffledMovie, setShuffledMovie] = useState<Movie | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [trendingData, recommendedData] = await Promise.all([
          getTrendingMovies(),
          userGenres.length > 0 ? getDiscoverMovies(userGenres.slice(0, 3)) : Promise.resolve([])
        ]);

        setTrending(trendingData.map(mapToMovie));
        if (recommendedData && recommendedData.length > 0) {
          setRecommended(recommendedData.map(mapToMovie));
        }
      } catch (error) {
        console.error('Erro ao carregar filmes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userGenres]);

  const handleShuffle = () => {
    setIsShuffling(true);
    setShuffledMovie(null);
    
    // Simular animação de sorteio
    setTimeout(() => {
      const allMovies = [...trending, ...recommended];
      const random = allMovies[Math.floor(Math.random() * allMovies.length)];
      setShuffledMovie(random);
      
      // Manter o estado de shuffling por um momento para a animação
      setTimeout(() => {
        setIsShuffling(false);
      }, 1500);
    }, 2000);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Sincronizando com os arquivos de cinema...</div>
      </div>
    );
  }

  const featured = recommended[0] || trending[0];

  return (
    <div className={styles.container}>
      {/* Raffle/Shuffle FAB */}
      <button className={styles.shuffleFAB} onClick={handleShuffle} disabled={isShuffling}>
        <span className={styles.shuffleIcon}>🎲</span>
        {isShuffling ? 'SORTEANDO...' : 'SURPREENDA-ME'}
      </button>

      {/* Raffle Animation Overlay */}
      {isShuffling && (
        <div className={styles.shuffleOverlay}>
          <div className={styles.shuffleAnimation}>
            <div className={styles.reelWrapper}>
              <div className={styles.reel}>
                {[...trending.slice(0, 5), ...recommended.slice(0, 5)].map((m, i) => (
                  <img key={i} src={m.poster} alt="" className={styles.reelImg} />
                ))}
              </div>
            </div>
            <div className={styles.shuffleText}>ESCOLHENDO SEU PRÓXIMO FILME...</div>
          </div>
        </div>
      )}

      {/* Shuffled Result Modal */}
      {shuffledMovie && !isShuffling && (
        <div className={styles.resultOverlay} onClick={() => setShuffledMovie(null)}>
          <div className={styles.resultCard} onClick={e => e.stopPropagation()}>
            <img src={shuffledMovie.backdrop} alt="" className={styles.resultBackdrop} />
            <div className={styles.resultContent}>
              <span className={styles.resultLabel}>SUA ESCOLHA DO DESTINO</span>
              <h2>{shuffledMovie.title}</h2>
              <div className={styles.resultMeta}>
                <span>★ {shuffledMovie.rating}</span>
                <span>{shuffledMovie.year}</span>
              </div>
              <p>{shuffledMovie.synopsis.slice(0, 150)}...</p>
              <div className={styles.resultActions}>
                <Link href={`/movie/${shuffledMovie.id}`} className={styles.resultPlayBtn}>
                  ASSISTIR AGORA
                </Link>
                <button className={styles.resultCloseBtn} onClick={() => setShuffledMovie(null)}>
                  SORTEAR NOVAMENTE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {featured && (
        <section className={styles.featured}>
          <div className={styles.featuredCard}>
            <img src={featured.backdrop} alt={featured.title} className={styles.featuredImg} />
            <div className={styles.featuredOverlay} />
            <div className={styles.featuredContent}>
              <span className={styles.categoryTag}>PARA VOCÊ</span>
              <h1>{featured.title}</h1>
              <div className={styles.featuredActions}>
                <Link href={`/movie/${featured.id}`} className={styles.playBtn}>
                  <span className={styles.playIcon}>▶</span>
                  Assistir Agora
                </Link>
                <button 
                  className={`${styles.plusBtn} ${watchlist.some(m => m.id === featured.id) ? styles.saved : ''}`}
                  onClick={() => {
                    if (watchlist.some(m => m.id === featured.id)) {
                      removeFromWatchlist(featured.id);
                    } else {
                      addToWatchlist(featured);
                    }
                  }}
                >
                  {watchlist.some(m => m.id === featured.id) ? '✓' : '+'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {recommended.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Baseado nos seus Gostos</h2>
            <Link href="/discover" className={styles.viewAll}>Ver Tudo</Link>
          </div>
          <div className={styles.movieGrid}>
            {recommended.slice(1, 7).map((movie) => (
              <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard}>
                <div className={styles.posterWrapper}>
                  <img src={movie.poster} alt={movie.title} />
                  <div className={styles.ratingBadge}>★ {movie.rating}</div>
                </div>
                <div className={styles.movieInfo}>
                  <h3>{movie.title}</h3>
                  <p>{movie.genres[0]?.toUpperCase() || 'FILME'}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Em Alta no Mundo</h2>
          <Link href="/discover" className={styles.viewAll}>Ver Tudo</Link>
        </div>
        <div className={styles.movieGrid}>
          {trending.slice(recommended.length > 0 ? 0 : 1, 13).map((movie) => (
            <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard}>
              <div className={styles.posterWrapper}>
                <img src={movie.poster} alt={movie.title} />
                <div className={styles.ratingBadge}>★ {movie.rating}</div>
              </div>
              <div className={styles.movieInfo}>
                <h3>{movie.title}</h3>
                <p>{movie.genres[0]?.toUpperCase() || 'FILME'}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
