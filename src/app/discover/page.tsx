'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { Movie } from '@/data/movies';
import { getTrendingMovies, mapToMovie, getDiscoverMovies, getNowPlayingMovies, searchMovies, TMDBMovie } from '@/lib/tmdb';
import { getAIRecommendations } from '@/lib/ai';
import Link from 'next/link';
import styles from './discover.module.css';

// Cache por usuário: chave muda a cada 24h ou quando forçado
function getDailyKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getCachedRecommendations(userId: string): Movie[] | null {
  try {
    const cached = localStorage.getItem(`curator_rec_${userId}`);
    if (!cached) return null;
    const { key, movies } = JSON.parse(cached);
    if (key !== getDailyKey()) return null;
    return movies as Movie[];
  } catch {
    return null;
  }
}

function setCachedRecommendations(userId: string, movies: Movie[]) {
  try {
    localStorage.setItem(`curator_rec_${userId}`, JSON.stringify({
      key: getDailyKey(),
      movies,
    }));
  } catch {}
}

function clearCachedRecommendations(userId: string) {
  localStorage.removeItem(`curator_rec_${userId}`);
}

export default function DiscoverPage() {
  const { 
    user,
    userGenres, 
    favoriteMovies, 
    watchlist, 
    addToWatchlist, 
    removeFromWatchlist 
  } = useUser();
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadRecommendations = useCallback(async (force = false) => {
    if (!user) return;
    
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const nowPlayingData = await getNowPlayingMovies();
      const nowPlayingIds = nowPlayingData ? nowPlayingData.map(m => m.id.toString()) : [];

      if (!force) {
        const cached = getCachedRecommendations(user.id);
        if (cached && cached.length > 0) {
          setRecommended(cached.filter(m => !nowPlayingIds.includes(m.id)));
          setLoading(false);
          return;
        }
      }

      if (userGenres.length > 0 || favoriteMovies.length > 0) {
        let fresh: TMDBMovie[] = [];
        
        const aiTitles = await getAIRecommendations(userGenres, favoriteMovies);
        
        if (aiTitles.length > 0) {
          const aiResults = await Promise.all(
            aiTitles.map(async (title: string) => {
              try {
                const searchData = await searchMovies(title);
                return searchData[0] || null;
              } catch {
                return null;
              }
            })
          );
          fresh = aiResults.filter((m): m is TMDBMovie => m !== null);
        }

        if (fresh.length === 0 && userGenres.length > 0) {
          const randomPage = Math.floor(Math.random() * 10) + 1;
          fresh = await getDiscoverMovies(userGenres, randomPage.toString(), nowPlayingIds);
        }

        const mapped = fresh
          .filter((m: TMDBMovie) => 
            m.poster_path && 
            m.backdrop_path && 
            m.overview && 
            m.overview.trim() !== '' &&
            !favoriteMovies.some(fav => m.title?.toLowerCase() === fav.toLowerCase())
          )
          .map(mapToMovie);
        
        const finalSelection = mapped.slice(0, 18);
        setCachedRecommendations(user.id, finalSelection);
        setRecommended(finalSelection);
      } else {
        const trendingData = await getTrendingMovies();
        const tmdbTrending = trendingData
          .filter((m: TMDBMovie) => m.poster_path && m.backdrop_path && m.overview)
          .map(mapToMovie);
        setRecommended(tmdbTrending.slice(0, 18));
      }
    } catch (error) {
      console.error('Erro ao carregar recomendações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, userGenres, favoriteMovies]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleRefresh = () => {
    if (user) {
      clearCachedRecommendations(user.id);
      loadRecommendations(true);
    }
  };



  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Preparando seu cinema...</div>
      </div>
    );
  }

  const featured = recommended[0];


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




      {/* ── Recomendados Para Você (18 filmes, rotação diária) ── */}
      {recommended.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2>Recomendados Para Você</h2>
              <span className={styles.refreshBadge}>🔄 Novos filmes todo dia</span>
            </div>
            <div className={styles.controlsGroup}>
              <button 
                className={`${styles.refreshBtn} ${refreshing ? styles.refreshing : ''}`}
                onClick={handleRefresh}
                disabled={refreshing}
                title="Atualizar Recomendações"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </button>
              <button 
                className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleActive : ''}`}
                onClick={() => setViewMode('grid')}
                title="Visualização em Grade"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
              <button 
                className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleActive : ''}`}
                onClick={() => setViewMode('list')}
                title="Visualização em Lista"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <div className={`${styles.movieGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
            {recommended.map(movie => (
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
    </div>
  );
}
