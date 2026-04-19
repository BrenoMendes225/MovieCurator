'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/discover');
    }
  }, [isLoggedIn, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Confirme seu e-mail para ativar sua conta!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/onboarding');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro na autenticação';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundBlur} />
      
      <div className={`${styles.loginCard} animate-fade-in`}>
        <div className={styles.header}>
          <h1 className={styles.logo}>CURATOR</h1>
          <p className={styles.subtitle}>{isSignUp ? 'CRIE SUA CONTA' : 'SEU LUGAR NA PRIMEIRA FILA DO CINEMA'}</p>
        </div>

        <form className={styles.form} onSubmit={handleAuth}>
          <div className={styles.inputGroup}>
            <label>EMAIL</label>
            <input 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <div className={styles.labelRow}>
              <label>SENHA</label>
              {!isSignUp && <span className={styles.forgot}>Esqueceu a senha?</span>}
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'CARREGANDO...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>OU CONTINUE COM</span>
        </div>

        <div className={styles.socialRow}>
          <button className={styles.socialBtn} onClick={() => handleSocialLogin('google')}>
            <img src="https://www.google.com/favicon.ico" alt="Google" />
            <span>Google</span>
          </button>
          <button className={styles.socialBtn} onClick={() => handleSocialLogin('apple')}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.05 20.28c-.96.95-2.12 1.43-3.48 1.43-1.25 0-2.26-.41-3.04-1.23-.78.82-1.79 1.23-3.04 1.23-1.36 0-2.52-.48-3.48-1.43C3.05 19.33 2.57 18.17 2.57 16.81c0-1.36.48-2.52 1.44-3.48.96-.95 2.12-1.43 3.48-1.43 1.25 0 2.26.41 3.04 1.23.78-.82 1.79-1.23 3.04-1.23 1.36 0 2.52.48 3.48 1.43.96.95 1.44 2.12 1.44 3.48s-.48 2.52-1.44 3.48zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            <span>Apple</span>
          </button>
        </div>

        <p className={styles.footer}>
          {isSignUp ? 'Já tem uma conta?' : 'Novo por aqui?'} {' '}
          <span 
            className={styles.signup} 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? 'Entrar agora' : 'Crie uma conta'}
          </span>
        </p>
      </div>
    </div>
  );
}
