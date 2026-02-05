import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useApi } from '../../hooks/useApi';

interface User {
  id: string;
  email: string;
  is_disabled: boolean;
  failed_login_attempts: number;
}

export default function UserManagement() {
  const { t } = useTranslation();
  const { get, post, loading } = useApi();
  
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const data = await get<User[]>('/admin/users');
    if (data) {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUnblock = async (userId: string) => {
    const data = await post(`/admin/unblock-user/${userId}`);
    if (data) {
      fetchUsers();
    }
  };

  return (
    <div className="admin-container">
      <h1>{t('user_management')}</h1>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('email')}</th>
              <th>{t('status')}</th>
              <th>Failed Attempts</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  <span className={`status-badge ${user.is_disabled ? 'disabled' : 'active'}`}>
                    {user.is_disabled ? t('disabled') : t('active')}
                  </span>
                </td>
                <td>{user.failed_login_attempts}</td>
                <td>
                  {user.is_disabled && (
                    <button
                      onClick={() => handleUnblock(user.id)}
                      className="btn-small"
                      disabled={loading}
                    >
                      {t('unblock')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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