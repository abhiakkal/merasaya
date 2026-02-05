import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useApi } from '../hooks/useApi';

export default function Reset() {
  const { t } = useTranslation();
  const router = useRouter();
  const { post, loading, error } = useApi();
  
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await post('/auth/request-reset', { email });

    if (data) {
      setStep('reset');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return;
    }

    const data = await post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });

    if (data) {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-subtitle success">{t('reset_success')}</h2>
          <p>{t('back_to_login')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{t('app_name')}</h1>
        <h2 className="auth-subtitle">{t('reset_password')}</h2>
        
        {step === 'request' ? (
          <form onSubmit={handleRequestReset}>
            <div className="form-group">
              <label>{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                dir="ltr"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '...' : t('send_reset_link')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>{t('verification_code')}</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="input"
                dir="ltr"
              />
            </div>

            <div className="form-group">
              <label>{t('new_password')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="input"
                dir="ltr"
              />
            </div>

            <div className="form-group">
              <label>{t('confirm_password')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input"
                dir="ltr"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '...' : t('reset_password')}
            </button>
          </form>
        )}

        <div className="auth-links">
          <a href="/login" className="link">{t('back_to_login')}</a>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    },
  };
}