import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || !JSON.parse(user).is_admin) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="admin-container">
      <h1>{t('admin_dashboard')}</h1>
      
      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => router.push('/admin/db')}>
          <h2>{t('database_settings')}</h2>
          <p>Configure and test database connections</p>
        </div>

        <div className="dashboard-card" onClick={() => router.push('/admin/users')}>
          <h2>{t('user_management')}</h2>
          <p>Manage users and unblock disabled accounts</p>
        </div>

        <div className="dashboard-card" onClick={() => router.push('/admin/functions')}>
          <h2>{t('function_runner')}</h2>
          <p>Execute NPM commands and RAG queries</p>
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