'use client';

import { use, useState, useEffect } from 'react';
import { Movie } from '@/data/movies';
import { useUser } from '@/context/UserContext';
import { getMovieDetails, mapToMovie, getWatchProviders, getImageUrl, WatchProviders, TMDBMovie } from '@/lib/tmdb';
import styles from './movie.module.css';

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ratings, addRating, addToWatchlist, removeFromWatchlist, watchlist } = useUser();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [rawMovie, setRawMovie] = useState<TMDBMovie | null>(null);
  const [trailers, setTrailers] = useState<{ id: string; key: string; name: string; type: string }[]>([]);
  const [providers, setProviders] = useState<WatchProviders | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(ratings[id]?.rating || 0);
  const [userReview, setUserReview] = useState(ratings[id]?.review || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const [movieData, providerData] = await Promise.all([
          getMovieDetails(id),
          getWatchProviders(id)
        ]);
        
        setRawMovie(movieData);
        const mapped = mapToMovie(movieData);
        setMovie(mapped);
        
        const rawTrailers = movieData.videos?.results?.filter((v) => v.type === 'Trailer') || [];
        setTrailers(rawTrailers.map(t => ({
          id: t.id || t.key,
          key: t.key,
          name: t.name || 'Trailer',
          type: t.type
        })));
        
        setProviders(providerData);
        setIsSaved(watchlist.some(m => m.id === id));
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id, watchlist]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHero} />
        <div className={styles.content}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonText} />
          <div className={styles.skeletonText} />
        </div>
      </div>
    );
  }

  if (!movie || !rawMovie) return <div className={styles.error}>Filme não encontrado</div>;

  const handleRate = (star: number) => setUserRating(star);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await addRating(movie.id, userRating, userReview);
    alert('Avaliação enviada! Obrigado.');
  };

  const handleWatchlist = async () => {
    if (!isSaved) {
      await addToWatchlist(movie);
      setIsSaved(true);
    } else {
      await removeFromWatchlist(movie.id);
      setIsSaved(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val || val === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <img src={movie.backdrop} alt={movie.title} className={styles.heroImg} />
        <div className={styles.heroOverlay} />
        <button className={styles.backBtn} onClick={() => window.history.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.ratingBadge}>★ {movie.rating}</div>
          <h1>{movie.title}</h1>
          <div className={styles.meta}>
            <span>{movie.year}</span>
            <span className={styles.dot}>•</span>
            <span>{movie.genres.join(', ').toUpperCase()}</span>
            <span className={styles.dot}>•</span>
            <span className={styles.quality}>4K ULTRA HD</span>
          </div>
        </div>

        <div className={styles.mainActions}>
          <div className={styles.providersSection}>
            <span className={styles.providersTitle}>DISPONÍVEL EM:</span>
            <div className={styles.providersList}>
              {providers?.flatrate ? (
                providers.flatrate.map((p) => (
                  <img 
                    key={p.provider_name} 
                    src={getImageUrl(p.logo_path)} 
                    alt={p.provider_name} 
                    title={p.provider_name}
                    className={styles.providerLogo}
                  />
                ))
              ) : (
                <span className={styles.noProviders}>Não disponível no streaming</span>
              )}
            </div>
          </div>
          
          <button 
            className={`${styles.watchlistBtn} ${isSaved ? styles.saved : ''}`}
            onClick={handleWatchlist}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {isSaved ? 'Na minha Lista' : 'Adicionar à Lista'}
          </button>
        </div>

        <section className={styles.section}>
          <h3>Sinopse</h3>
          <p className={styles.synopsisText}>{movie.synopsis}</p>
        </section>

        {trailers.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Trailers e Clipes</h3>
              <button className={styles.viewAll}>VER TUDO</button>
            </div>
            <div className={styles.trailersScroll}>
              {trailers.map((trailer) => (
                <div key={trailer.id} className={styles.trailerCard}>
                  <div className={styles.trailerThumb} onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`)}>
                    <img src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`} alt={trailer.name} />
                    <div className={styles.playCircle}>▶</div>
                  </div>
                  <h4>{trailer.name}</h4>
                  <p>{trailer.type.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className={styles.reviewCard}>
          <div className={styles.reviewHeader}>
            <h3>Sua Avaliação</h3>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span 
                  key={s} 
                  className={s <= userRating ? styles.starActive : styles.starInactive}
                  onClick={() => handleRate(s)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmitReview}>
            <textarea 
              className={styles.reviewInput}
              placeholder="O que achou do filme? Sua opinião ajuda outros curadores."
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
            />
            <button type="submit" className={styles.postBtn}>PUBLICAR AVALIAÇÃO</button>
          </form>
        </div>

        <section className={styles.section}>
          <h3>Elenco Principal</h3>
          <div className={styles.castList}>
            {movie.cast.map((actor, i) => (
              <div key={actor} className={styles.castItem}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${actor}`} alt={actor} />
                <div className={styles.castInfo}>
                  <h4>{actor}</h4>
                  <p>{i === 0 ? 'Protagonista' : 'Elenco'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.statsTable}>
          <div className={styles.statRow}>
            <span>Produção</span>
            <span>{rawMovie.production_companies?.[0]?.name || 'N/A'}</span>
          </div>
          <div className={styles.statRow}>
            <span>Orçamento</span>
            <span>{formatCurrency(rawMovie.budget)}</span>
          </div>
          <div className={styles.statRow}>
            <span>Receita</span>
            <span>{formatCurrency(rawMovie.revenue)}</span>
          </div>
          <div className={styles.statRow}>
            <span>Idiomas</span>
            <span>{rawMovie.spoken_languages?.map(l => l.name).join(', ') || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
