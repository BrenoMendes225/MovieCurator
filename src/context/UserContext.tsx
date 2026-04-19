'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Movie } from '@/data/movies';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserContextType {
  user: User | null;
  userGenres: string[];
  setUserGenres: (genres: string[]) => Promise<void>;
  watchlist: Movie[];
  addToWatchlist: (movie: Movie) => Promise<void>;
  removeFromWatchlist: (movieId: string) => Promise<void>;
  ratings: Record<string, { rating: number; review: string }>;
  addRating: (movieId: string, rating: number, review: string) => Promise<void>;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userGenres, setUserGenresState] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [ratings, setRatings] = useState<Record<string, { rating: number; review: string }>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const resetState = useCallback(() => {
    setUserGenresState([]);
    setWatchlist([]);
    setRatings({});
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // 1. Fetch Profile (Genres)
      const { data: profile } = await supabase
        .from('profiles')
        .select('genres')
        .eq('id', userId)
        .single();
      
      if (profile) setUserGenresState(profile.genres || []);

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
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      if (session?.user) fetchUserData(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        resetState();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData, resetState]);

  const setUserGenres = async (genres: string[]) => {
    if (!user) return;
    setUserGenresState(genres);
    await supabase.from('profiles').upsert({ id: user.id, genres, updated_at: new Date() });
  };

  const addToWatchlist = async (movie: Movie) => {
    if (!user) return;
    const newList = [...watchlist, movie];
    setWatchlist(newList);
    await supabase.from('watchlist').insert({ user_id: user.id, movie_id: movie.id });
  };

  const removeFromWatchlist = async (movieId: string) => {
    if (!user) return;
    const newList = watchlist.filter((m) => m.id !== movieId);
    setWatchlist(newList);
    await supabase.from('watchlist').delete().eq('user_id', user.id).eq('movie_id', movieId);
  };

  const addRating = async (movieId: string, rating: number, review: string) => {
    if (!user) return;
    const newRatings = { ...ratings, [movieId]: { rating, review } };
    setRatings(newRatings);
    await supabase.from('ratings').upsert({ 
      user_id: user.id, 
      movie_id: movieId, 
      rating, 
      review,
      created_at: new Date()
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userGenres,
        setUserGenres,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        ratings,
        addRating,
        isLoggedIn,
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
