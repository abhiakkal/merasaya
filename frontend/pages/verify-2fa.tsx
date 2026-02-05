import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useApi } from '../hooks/useApi';

export default function Verify2FA() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { post, loading, error } = useApi();
  
  const [code, setCode] = useState('');

  useEffect(() => {
    // Check if we have the email
    const email = localStorage.getItem('temp_user_email');
    if (!email) {
      console.log('No email found, redirecting to login');
      router.push('/login');
    }
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = localStorage.getItem('temp_user_email');
    if (!email) {
      console.log('No email in localStorage');
      router.push('/login');
      return;
    }

    console.log('Verifying 2FA with email:', email, 'code:', code);

    // Send as query parameters
    const data = await post(`/auth/verify-2fa?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);

    console.log('2FA Response:', data);

    if (data) {
      if (data.access_token) {
        console.log('2FA Success! Token:', data.access_token);
        localStorage.removeItem('temp_user_email');
        localStorage.setItem('access_token', data.access_token);
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('User saved:', data.user);
        } else {
          // Fallback if user not in response
          localStorage.setItem('user', JSON.stringify({ email: email, is_admin: email.endsWith('@admin.com') }));
        }
        
        console.log('Redirecting to home...');
        router.push('/');
      } else {
        console.error('No access token in response');
      }
    } else {
      console.error('No data returned from verify-2fa');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{t('app_name')}</h1>
        <h2 className="auth-subtitle">{t('verify_2fa')}</h2>
        
        <p style={{ marginBottom: '1rem', color: '#64748b' }}>
          Check your backend terminal for the 6-digit code
        </p>
        
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label>{t('verification_code')}</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="input"
              dir="ltr"
              placeholder="000000"
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading || code.length !== 6}>
            {loading ? '...' : t('verify_button')}
          </button>
        </form>

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
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}