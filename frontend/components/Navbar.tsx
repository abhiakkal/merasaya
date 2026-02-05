import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const changeLanguage = (lng: string) => {
    router.push(router.pathname, router.asPath, { locale: lng });
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>{t('app_name')}</h1>
      </div>
      <div className="navbar-menu">
        <div className="navbar-item">
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="language-selector"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
          </select>
        </div>
        {user.is_admin && (
          <div className="navbar-item">
            <button onClick={() => router.push('/admin')} className="btn-link">
              {t('admin_dashboard')}
            </button>
          </div>
        )}
        <div className="navbar-item">
          <span className="user-email">{user.email}</span>
        </div>
        <div className="navbar-item">
          <button onClick={handleLogout} className="btn-secondary">
            {t('logout')}
          </button>
        </div>
      </div>
    </nav>
  );
}