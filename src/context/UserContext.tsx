'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Movie } from '@/data/movies';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserContextType {
  user: User | null;
  userGenres: string[];
  setUserGenres: (genres: string[]) => Promise<void>;
  avatarUrl: string | null;
  updateAvatar: (url: string) => Promise<void>;
  notifications: any[];
  markNotificationAsRead: (id: string) => Promise<void>;
  watchlist: Movie[];
  addToWatchlist: (movie: Movie) => Promise<void>;
  removeFromWatchlist: (movieId: string) => Promise<void>;
  ratings: Record<string, { rating: number; review: string }>;
  addRating: (movieId: string, rating: number, review: string) => Promise<void>;
  isLoggedIn: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userGenres, setUserGenresState] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [ratings, setRatings] = useState<Record<string, { rating: number; review: string }>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const resetState = useCallback(() => {
    setUserGenresState([]);
    setAvatarUrlState(null);
    setNotifications([]);
    setWatchlist([]);
    setRatings({});
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // 1. Fetch Profile (Genres and Avatar)
      const { data: profile } = await supabase
        .from('profiles')
        .select('genres, avatar_url')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setUserGenresState(profile.genres || []);
        setAvatarUrlState(profile.avatar_url || null);
      }

      // 2. Fetch Watchlist
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', userId);
      
      if (watchlistData) {
        const movieIds = watchlistData.map(w => w.movie_id);
        const { getMovieDetails, mapToMovie } = await import('@/lib/tmdb');
        const movies = await Promise.all(
          movieIds.map(async (id) => {
            try {
              const data = await getMovieDetails(id);
              return mapToMovie(data);
            } catch {
              return null;
            }
          })
        );
        setWatchlist(movies.filter(m => m !== null) as Movie[]);
      }

      // 3. Fetch Ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('movie_id, rating, review')
        .eq('user_id', userId);
      
      if (ratingsData) {
        const ratingsMap = ratingsData.reduce((acc, curr) => ({
          ...acc,
          [curr.movie_id]: { rating: curr.rating, review: curr.review }
        }), {});
        setRatings(ratingsMap);
      }

      // 4. Fetch Notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (notificationsData) {
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      setIsLoggedIn(!!session);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        resetState();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData, resetState, supabase.auth]);

  const setUserGenres = async (genres: string[]) => {
    if (!user) return;
    setUserGenresState(genres);
    await supabase.from('profiles').upsert({ id: user.id, genres, updated_at: new Date().toISOString() });
  };

  const updateAvatar = async (url: string) => {
    if (!user) return;
    setAvatarUrlState(url);
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
  };

  const markNotificationAsRead = async (id: string) => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const addToWatchlist = async (movie: Movie) => {
    if (!user) return;
    // Optimistic update
    setWatchlist(prev => [...prev, movie]);
    const { error } = await supabase.from('watchlist').insert({ user_id: user.id, movie_id: movie.id });
    if (error) {
      console.error('Error adding to watchlist:', error);
      // Rollback on error
      setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    }
  };

  const removeFromWatchlist = async (movieId: string) => {
    if (!user) return;
    // Optimistic update
    const movieToRemove = watchlist.find(m => m.id === movieId);
    setWatchlist(prev => prev.filter((m) => m.id !== movieId));
    
    const { error } = await supabase.from('watchlist').delete().eq('user_id', user.id).eq('movie_id', movieId);
    if (error && movieToRemove) {
      console.error('Error removing from watchlist:', error);
      // Rollback on error
      setWatchlist(prev => [...prev, movieToRemove]);
    }
  };

  const addRating = async (movieId: string, rating: number, review: string) => {
    if (!user) return;
    const oldRating = ratings[movieId];
    setRatings(prev => ({ ...prev, [movieId]: { rating, review } }));
    
    const { error } = await supabase.from('ratings').upsert({ 
      user_id: user.id, 
      movie_id: movieId, 
      rating, 
      review,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error adding rating:', error);
      if (oldRating) {
        setRatings(prev => ({ ...prev, [movieId]: oldRating }));
      } else {
        setRatings(prev => {
          const newState = { ...prev };
          delete newState[movieId];
          return newState;
        });
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    resetState();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userGenres,
        setUserGenres,
        avatarUrl,
        updateAvatar,
        notifications,
        markNotificationAsRead,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        ratings,
        addRating,
        isLoggedIn,
        loading,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
