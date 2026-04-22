'use client';

import { useState } from 'react';
import { useUser as useUserContext } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, userGenres, ratings, watchlist, logout, avatarUrl, updateAvatar } = useUserContext();
  const router = useRouter();
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const PRESET_AVATARS = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || '1'}`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || '2'}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email || '3'}`,
    `https://api.dicebear.com/7.x/micah/svg?seed=${user?.email || '4'}`,
    `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || '5'}`,
  ];

  const currentAvatar = avatarUrl || PRESET_AVATARS[0];

  const reviewsCount = Object.keys(ratings).length;

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrapper} onClick={() => setIsEditingAvatar(!isEditingAvatar)}>
          <img src={currentAvatar} alt="Avatar" />
          <button className={styles.editBtn}>✎</button>
        </div>
        <h1>{user?.email?.split('@')[0].toUpperCase() || 'CURATOR'}</h1>
        <p className={styles.memberSince}>MEMBRO PREMIUM DESDE 2024</p>
      </div>

      {isEditingAvatar && (
        <section className={styles.section}>
          <h3>Escolha seu Avatar</h3>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem 0' }}>
            {PRESET_AVATARS.map((url, i) => (
              <img 
                key={i} 
                src={url} 
                alt="Avatar Option" 
                style={{ 
                  width: '60px', height: '60px', cursor: 'pointer', borderRadius: '50%',
                  border: currentAvatar === url ? '3px solid #e50914' : '3px solid transparent'
                }}
                onClick={() => {
                  updateAvatar(url);
                  setIsEditingAvatar(false);
                }}
              />
            ))}
          </div>
        </section>
      )}

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{reviewsCount}</span>
          <span className={styles.statLabel}>AVALIAÇÕES</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>{watchlist.length}</span>
          <span className={styles.statLabel}>MINHA LISTA</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>{userGenres.length}</span>
          <span className={styles.statLabel}>GÊNEROS</span>
        </div>
      </div>

      <section className={styles.section}>
        <h3>Gêneros Favoritos</h3>
        <div className={styles.genresGrid}>
          {userGenres.map((genre) => (
            <div key={genre} className={styles.genreChip}>
              {genre}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3>Configurações da Conta</h3>
        <div className={styles.settingsList}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4>Notificações Push</h4>
              <p>Receba alertas de novos lançamentos</p>
            </div>
            <div className={styles.toggle} />
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4>Qualidade de Download</h4>
              <p>Atual: 4K HDR (Premium)</p>
            </div>
            <span className={styles.arrow}>›</span>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4>Privacidade e Segurança</h4>
              <p>Gerencie seus dados de conta</p>
            </div>
            <span className={styles.arrow}>›</span>
          </div>
        </div>
      </section>

      <button className={styles.logoutBtn} onClick={handleLogout}>SAIR</button>
      <p className={styles.version}>VERSÃO 2.4.1 (NEON)</p>
    </div>
  );
}
