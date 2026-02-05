import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useApi } from '../../hooks/useApi';

export default function DatabaseSettings() {
  const { t } = useTranslation();
  const { post, loading } = useApi();
  
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: '5432',
    database: 'merasaya',
    user: 'postgres',
    password: '',
  });
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    const data = await post('/admin/test-db', dbConfig);
    if (data) {
      setTestResult(data.status === 'success' ? t('connection_successful') : t('connection_failed'));
    }
  };

  const handleSave = async () => {
    const data = await post('/admin/connect-db', dbConfig);
    if (data) {
      setTestResult(t('connection_successful'));
    }
  };

  return (
    <div className="admin-container">
      <h1>{t('database_settings')}</h1>

      <div className="form-card">
        <div className="form-group">
          <label>{t('database_host')}</label>
          <input
            type="text"
            value={dbConfig.host}
            onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
            className="input"
            dir="ltr"
          />
        </div>

        <div className="form-group">
          <label>{t('database_port')}</label>
          <input
            type="text"
            value={dbConfig.port}
            onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
            className="input"
            dir="ltr"
          />
        </div>

        <div className="form-group">
          <label>{t('database_name')}</label>
          <input
            type="text"
            value={dbConfig.database}
            onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
            className="input"
            dir="ltr"
          />
        </div>

        <div className="form-group">
          <label>{t('database_user')}</label>
          <input
            type="text"
            value={dbConfig.user}
            onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
            className="input"
            dir="ltr"
          />
        </div>

        <div className="form-group">
          <label>{t('database_password')}</label>
          <input
            type="password"
            value={dbConfig.password}
            onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
            className="input"
            dir="ltr"
          />
        </div>

        {testResult && (
          <div className={`result-message ${testResult.includes('success') ? 'success' : 'error'}`}>
            {testResult}
          </div>
        )}

        <div className="button-group">
          <button onClick={handleTest} className="btn-secondary" disabled={loading}>
            {t('test_connection')}
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={loading}>
            {t('connect_database')}
          </button>
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