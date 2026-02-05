import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useApi } from '../hooks/useApi';
import Captcha from '../components/Captcha';

export default function Login() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { post, loading, error, setError } = useApi();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      email: email,
      password: password,
    };

    const data = await post('/auth/login', payload);

    if (data) {
      if (data.token_type === '2fa_pending') {
        localStorage.setItem('temp_user_email', email);
        router.push('/verify-2fa');
      } else if (data.access_token && data.user) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{t('app_name')}</h1>
        <h2 className="auth-subtitle">{t('login')}</h2>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              dir="ltr"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
              dir="ltr"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '...' : t('login_button')}
          </button>
        </form>

        <div className="auth-links">
          <a href="/reset" className="link">{t('forgot_password')}</a>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}