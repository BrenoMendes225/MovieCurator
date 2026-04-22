'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { Movie } from '@/data/movies';
import { getTrendingMovies, mapToMovie, getDiscoverMovies, getNowPlayingMovies } from '@/lib/tmdb';
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

  useEffect(() => {
    const load = async () => {
      try {
        // ── 1. Buscar filmes nos cinemas para filtragem (não serão exibidos) ──
        const nowPlayingData = await getNowPlayingMovies();
        const nowPlayingIds = nowPlayingData ? nowPlayingData.map(m => m.id.toString()) : [];

        // ── 2. Recomendações com cache de 24h (Filtradas por Gênero e SEM cinema) ──
        const cached = getCachedRecommendations();
        if (cached && cached.length > 0) {
          // Filtrar cache também caso algo tenha entrado no cinema
          setRecommended(cached.filter(m => !nowPlayingIds.includes(m.id)));
        } else if (userGenres.length > 0) {
          const randomPage = Math.floor(Math.random() * 5) + 1;
          // getDiscoverMovies agora aceita excludeIds e lida com mapeamento de nomes para IDs
          const fresh = await getDiscoverMovies(userGenres, randomPage.toString(), nowPlayingIds);
          const mapped = fresh
            .filter(m => m.poster_path && m.backdrop_path && m.overview && m.overview.trim() !== '')
            .slice(0, 12)
            .map(mapToMovie);
          
          // Verify filtering
          const overlap = mapped.filter(m => nowPlayingIds.includes(m.id));
          console.log('Verification: Movies in both recommended and nowPlaying:', overlap.length === 0 ? 'None (Pass)' : overlap);
          
          setCachedRecommendations(mapped);
          setRecommended(mapped);
        }

        // ── 3. Tendências (SEM cinema) ──
        const trendingData = await getTrendingMovies();
        const tmdbTrending = trendingData
          .filter((m: any) => m.poster_path && m.backdrop_path && m.overview && m.overview.trim() !== '')
          .map(mapToMovie)
          .filter((m: Movie) => !nowPlayingIds.includes(m.id) && m.title !== 'Too Many Cooks');
        
        setTrending(tmdbTrending);
      } catch (error) {
        console.error('Erro ao carregar filmes:', error);

      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userGenres]);



  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Preparando seu cinema...</div>
      </div>
    );
  }

  const featured = trending[0];


  return (
    <div className={styles.container}>

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

      {/* ── Seção removida: Nos Cinemas ── */}


      {/* ── Recomendados Para Você (Removido a pedido) ── */}

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
