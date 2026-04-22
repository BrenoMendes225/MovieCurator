'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { searchMovies, mapToMovie } from '@/lib/tmdb';
import { Movie } from '@/data/movies';
import styles from './Header.module.css';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const { isLoggedIn, avatarUrl, notifications, markNotificationAsRead, user } = useUser();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    setSearchOpen(false);
    setNotificationsOpen(false);
    setQuery('');
    setResults([]);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen) setSearchOpen(false);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) setNotificationsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchMovies(val);
        setResults(data.slice(0, 6).map(mapToMovie));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      handleClose();
    }
  };

  if (!isLoggedIn) return null;
  if (pathname.startsWith('/onboarding')) return null;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/discover" className={styles.logo}>CURATOR</Link>
      </div>

      <div className={styles.right} ref={wrapperRef}>
        {/* Search bar */}
        <div className={`${styles.searchWrapper} ${searchOpen ? styles.searchOpen : ''}`}>
          {searchOpen && (
            <input
              ref={inputRef}
              className={styles.searchInput}
              type="text"
              placeholder="Buscar filmes..."
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          )}

          {/* Results dropdown */}
          {searchOpen && (results.length > 0 || searching) && (
            <div className={styles.resultsDropdown}>
              {searching && (
                <div className={styles.searchingMsg}>Buscando...</div>
              )}
              {results.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/movie/${movie.id}`}
                  className={styles.resultItem}
                  onClick={handleClose}
                >
                  <img src={movie.poster} alt={movie.title} className={styles.resultPoster} />
                  <div className={styles.resultInfo}>
                    <span className={styles.resultTitle}>{movie.title}</span>
                    <span className={styles.resultMeta}>{movie.year} • {movie.genres[0]}</span>
                  </div>
                  <span className={styles.resultRating}>★ {movie.rating}</span>
                </Link>
              ))}
              {!searching && results.length === 0 && query.length >= 2 && (
                <div className={styles.noResults}>Nenhum resultado encontrado</div>
              )}
            </div>
          )}
        </div>

        <button
          className={`${styles.iconBtn} ${searchOpen ? styles.iconBtnActive : ''}`}
          onClick={toggleSearch}
          aria-label="Buscar"
        >
          {searchOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </button>

        <div className={styles.notificationWrapper}>
          <button
            className={`${styles.iconBtn} ${notificationsOpen ? styles.iconBtnActive : ''}`}
            onClick={toggleNotifications}
            aria-label="Notificações"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className={styles.notificationBadge} />
            )}
          </button>

          {notificationsOpen && (
            <div className={styles.notificationsDropdown}>
              <div className={styles.notificationsHeader}>Notificações</div>
              <div className={styles.notificationsList}>
                {notifications.length === 0 ? (
                  <div className={styles.noNotifications}>Você não tem novas notificações</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`${styles.notificationItem} ${!n.is_read ? styles.unread : ''}`}
                      onClick={() => {
                        if (!n.is_read) markNotificationAsRead(n.id);
                      }}
                    >
                      <p>{n.message}</p>
                      <span className={styles.notificationTime}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link href="/profile" className={styles.avatar}>
          <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Felix'}`} alt="Avatar" />
        </Link>
      </div>
    </header>
  );
}
