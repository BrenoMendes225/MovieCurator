'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { createClient } from '@/utils/supabase/client';
import styles from './page.module.css';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { isLoggedIn } = useUser();
  const router = useRouter();
  
  const supabase = createClient();

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/discover');
    }
  }, [isLoggedIn, router]);

  const translateError = (msg: string): string => {
    if (msg.includes('email rate limit')) return 'Limite de cadastros atingido. Aguarde alguns minutos e tente novamente.';
    if (msg.includes('already registered') || msg.includes('User already registered')) return 'Este e-mail já possui uma conta. Tente entrar.';
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
    if (msg.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (msg.includes('Unable to validate email')) return 'Endereço de e-mail inválido.';
    if (msg.includes('signup is disabled')) return 'Cadastro temporariamente desativado. Tente mais tarde.';
    return 'Algo deu errado. Tente novamente.';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { display_name: name }
          }
        });
        if (error) throw error;
        // Se confirmação de email está desativada, o usuário já está logado
        if (data.session) {
          router.push('/onboarding');
        } else {
          setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/discover');

      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      setErrorMsg(translateError(raw));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundBlur} />
      
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img src="/logo.png" alt="MoviFlow Logo" className={styles.logoImg} />
          </div>
          <p className={styles.subtitle}>
            {isSignUp ? 'FAÇA PARTE DA ELITE' : 'SEU LUGAR NA PRIMEIRA FILA'}
          </p>
        </div>

        <div className={styles.tabSwitcher}>
          <div className={`${styles.tabIndicator} ${isSignUp ? styles.tabIndicatorRight : ''}`} />
          <button 
            className={`${styles.tab} ${!isSignUp ? styles.activeTab : ''}`}
            onClick={() => setIsSignUp(false)}
          >
            ENTRAR
          </button>
          <button 
            className={`${styles.tab} ${isSignUp ? styles.activeTab : ''}`}
            onClick={() => setIsSignUp(true)}
          >
            CRIAR CONTA
          </button>
        </div>

        <form className={styles.form} onSubmit={handleAuth}>
          {isSignUp && (
            <div className={styles.inputWrapper}>
              <label>NOME COMPLETO</label>
              <input 
                className={styles.inputField}
                type="text" 
                placeholder="Como quer ser chamado?" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className={styles.inputWrapper}>
            <label>EMAIL</label>
            <input 
              className={styles.inputField}
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.inputWrapper}>
            <label>SENHA</label>
            <input 
              className={styles.inputField}
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isSignUp && (
            <span className={styles.forgotLink}>Esqueceu sua senha?</span>
          )}

          {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
          {successMsg && <div className={styles.successBox}>{successMsg}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'PROCESSANDO...' : isSignUp ? 'COMEÇAR AGORA' : 'ENTRAR NO CINEMA'}
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.line} />
          <span className={styles.dividerText}>OU ACESSE COM</span>
          <div className={styles.line} />
        </div>

        <div className={styles.socialGrid}>
          <button className={styles.socialButton} onClick={() => handleSocialLogin('google')}>
            <img src="https://www.google.com/favicon.ico" alt="Google" />
            <span>Google</span>
          </button>
          <button className={styles.socialButton} onClick={() => handleSocialLogin('apple')}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.82-.779.883-1.468 2.337-1.287 3.713 1.351.104 2.727-.69 3.574-1.703z"/>
            </svg>
            <span>Apple</span>
          </button>
        </div>

        <p className={styles.legal}>
          Ao continuar, você concorda com nossos <span>Termos</span> e <span>Privacidade</span>.
        </p>
      </div>
    </div>
  );
}
