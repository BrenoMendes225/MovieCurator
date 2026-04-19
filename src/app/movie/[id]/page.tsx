'use client';

import { use, useState, useEffect } from 'react';
import { Movie } from '@/data/movies';
import { useUser } from '@/context/UserContext';
import { getMovieDetails, mapToMovie } from '@/lib/tmdb';
import styles from './movie.module.css';

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ratings, addRating, addToWatchlist, removeFromWatchlist, watchlist } = useUser();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [trailers, setTrailers] = useState<{ id: string; key: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(ratings[id]?.rating || 0);
  const [userReview, setUserReview] = useState(ratings[id]?.review || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await getMovieDetails(id);
        const mapped = mapToMovie(data);
        setMovie(mapped);
        setTrailers(data.videos?.results?.filter((v) => v.type === 'Trailer') || []);
        setIsSaved(watchlist.some(m => m.id === id));
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id, watchlist]);

  if (loading) return <div className={styles.loading}>Sincronizando com os arquivos de cinema...</div>;
  if (!movie) return <div className={styles.error}>Filme não encontrado</div>;

  const handleRate = (star: number) => {
    setUserRating(star);
  };

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

  return (
    <div className={styles.container}>
      {/* Hero Backdrop */}
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
            <span>{movie.genres[0]?.toUpperCase()}</span>
            <span className={styles.dot}>•</span>
            <span>2H 15M</span>
            <span className={styles.dot}>•</span>
            <span className={styles.quality}>4K HDR</span>
          </div>
        </div>

        <div className={styles.mainActions}>
          <button className={styles.watchNowBtn}>
            <span className={styles.playIcon}>▶</span>
            Assistir Agora
          </button>
          <button 
            className={`${styles.watchlistBtn} ${isSaved ? styles.saved : ''}`}
            onClick={handleWatchlist}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Minha Lista
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
              placeholder="Compartilhe sua opinião sobre o filme..."
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
                  <p>{i === 0 ? 'Ator Principal' : 'Papel Coadjuvante'}</p>
                </div>
              </div>
            ))}
            <div className={styles.castItem}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${movie.director}`} alt={movie.director} />
              <div className={styles.castInfo}>
                <h4>{movie.director}</h4>
                <p>Diretor</p>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.statsTable}>
          <div className={styles.statRow}>
            <span>Estúdio</span>
            <span>Prism Studios</span>
          </div>
          <div className={styles.statRow}>
            <span>Orçamento</span>
            <span>$185.00M</span>
          </div>
          <div className={styles.statRow}>
            <span>Idioma</span>
            <span>Português, Inglês, Japonês</span>
          </div>
        </div>
      </div>
    </div>
  );
}
