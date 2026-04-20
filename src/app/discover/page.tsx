'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { Movie, MOVIES } from '@/data/movies';
import { getTrendingMovies, mapToMovie, getDiscoverMovies, getNowPlayingMovies, getRandomMovie } from '@/lib/tmdb';
import Link from 'next/link';
import styles from './discover.module.css';

// Rotação diária: chave muda a cada 24h
function getDailyKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getCachedRecommendations(): Movie[] | null {
  try {
    const cached = localStorage.getItem('curator_recommendations');
    if (!cached) return null;
    const { key, movies } = JSON.parse(cached);
    if (key !== getDailyKey()) return null; // Expirado — novo dia
    return movies as Movie[];
  } catch {
    return null;
  }
}

function setCachedRecommendations(movies: Movie[]) {
  try {
    localStorage.setItem('curator_recommendations', JSON.stringify({
      key: getDailyKey(),
      movies,
    }));
  } catch {}
}

export default function DiscoverPage() {
  const { userGenres, watchlist, addToWatchlist, removeFromWatchlist } = useUser();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffledMovie, setShuffledMovie] = useState<Movie | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // ── Recomendações com cache de 24h ──
        const cached = getCachedRecommendations();
        if (cached && cached.length > 0) {
          setRecommended(cached);
        } else if (userGenres.length > 0) {
          // Buscar nova seleção do dia com aleatoriedade (page variável)
          const randomPage = Math.floor(Math.random() * 5) + 1;
          const fresh = await getDiscoverMovies(userGenres.slice(0, 3), randomPage.toString());
          const mapped = fresh.filter(m => m.poster_path).slice(0, 12).map(mapToMovie);
          setCachedRecommendations(mapped);
          setRecommended(mapped);
        }

        // ── Tendências + Nos Cinemas ──
        const [trendingData, nowPlayingData] = await Promise.all([
          getTrendingMovies(),
          getNowPlayingMovies(),
        ]);

        const tmdbTrending = trendingData.map(mapToMovie);
        setTrending([...MOVIES, ...tmdbTrending]);

        if (nowPlayingData) {
          setNowPlaying(nowPlayingData.filter(m => m.poster_path).map(mapToMovie));
        }
      } catch (error) {
        console.error('Erro ao carregar filmes:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userGenres]);

  const handleShuffle = useCallback(async () => {
    setIsShuffling(true);
    setShuffledMovie(null);
    try {
      const raw = await getRandomMovie();
      const movie = mapToMovie(raw);
      setTimeout(() => {
        setShuffledMovie(movie);
        setIsShuffling(false);
      }, 2500);
    } catch {
      const fallback = trending[Math.floor(Math.random() * trending.length)];
      setTimeout(() => {
        setShuffledMovie(fallback);
        setIsShuffling(false);
      }, 2500);
    }
  }, [trending]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Preparando seu cinema...</div>
      </div>
    );
  }

  const featured = nowPlaying[0] || recommended[0] || trending[0];

  return (
    <div className={styles.container}>
      {/* ── Shuffle FAB ── */}
      <button className={styles.shuffleFAB} onClick={handleShuffle} disabled={isShuffling}>
        <span>🎲</span>
        {isShuffling ? 'LANÇANDO...' : 'SORTEAR FILME'}
      </button>

      {/* ── 3D Dice Overlay ── */}
      {isShuffling && (
        <div className={styles.shuffleOverlay}>
          <div className={styles.diceContainer}>
            <div className={styles.dice}>
              <div className={`${styles.face} ${styles.front}`}>1</div>
              <div className={`${styles.face} ${styles.back}`}>6</div>
              <div className={`${styles.face} ${styles.right}`}>3</div>
              <div className={`${styles.face} ${styles.left}`}>4</div>
              <div className={`${styles.face} ${styles.top}`}>5</div>
              <div className={`${styles.face} ${styles.bottom}`}>2</div>
            </div>
            <div className={styles.shuffleText}>O destino decide...</div>
          </div>
        </div>
      )}

      {/* ── Result Modal ── */}
      {shuffledMovie && !isShuffling && (
        <div className={styles.resultOverlay} onClick={() => setShuffledMovie(null)}>
          <div className={styles.resultCard} onClick={e => e.stopPropagation()}>
            <img src={shuffledMovie.backdrop} alt="" className={styles.resultBackdrop} />
            <div className={styles.resultContent}>
              <span className={styles.resultLabel}>A SORTE LANÇOU:</span>
              <h2>{shuffledMovie.title}</h2>
              <div className={styles.resultMeta}>
                <span>★ {shuffledMovie.rating}</span>
                <span>{shuffledMovie.year}</span>
              </div>
              <p>{shuffledMovie.synopsis.slice(0, 150)}...</p>
              <div className={styles.resultActions}>
                <Link href={`/movie/${shuffledMovie.id}`} className={styles.resultPlayBtn}>
                  VER DETALHES
                </Link>
                <button className={styles.resultCloseBtn} onClick={handleShuffle}>
                  JOGAR DE NOVO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Featured ── */}
      {featured && (
        <section className={styles.featured}>
          <div className={styles.featuredCard}>
            <img src={featured.backdrop} alt={featured.title} className={styles.featuredImg} />
            <div className={styles.featuredOverlay} />
            <div className={styles.featuredContent}>
              <span className={styles.categoryTag}>DESTAQUE DO DIA</span>
              <h1>{featured.title}</h1>
              <div className={styles.featuredActions}>
                <Link href={`/movie/${featured.id}`} className={styles.playBtn}>
                  <span>▶</span> Ver Detalhes
                </Link>
                <button
                  className={`${styles.plusBtn} ${watchlist.some(m => m.id === featured.id) ? styles.saved : ''}`}
                  onClick={() => watchlist.some(m => m.id === featured.id)
                    ? removeFromWatchlist(featured.id)
                    : addToWatchlist(featured)}
                >
                  {watchlist.some(m => m.id === featured.id) ? '✓' : '+'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Nos Cinemas ── */}
      {nowPlaying.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Nos Cinemas Agora</h2>
          </div>
          <div className={styles.movieGrid}>
            {nowPlaying.slice(0, 6).map(movie => (
              <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard}>
                <div className={styles.posterWrapper}>
                  <img src={movie.poster} alt={movie.title} />
                  <div className={styles.ratingBadge}>★ {movie.rating}</div>
                  <div className={styles.nowPlayingBadge}>NO CINEMA</div>
                </div>
                <div className={styles.movieInfo}>
                  <h3>{movie.title}</h3>
                  <p>{(movie.genres[0] || 'FILME').toUpperCase()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Recomendados Para Você (rotação diária) ── */}
      {recommended.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Para Você Hoje</h2>
            <span className={styles.refreshBadge}>🔄 Renova todo dia</span>
          </div>
          <div className={styles.movieGrid}>
            {recommended.slice(0, 12).map(movie => (
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
        </section>
      )}

      {/* ── Catálogo Geral ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Explorar Catálogo</h2>
        </div>
        <div className={styles.movieGrid}>
          {trending.slice(0, 18).map(movie => (
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
      </section>
    </div>
  );
}
