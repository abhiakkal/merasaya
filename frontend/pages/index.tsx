import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const userData = JSON.parse(user);
      if (userData.is_admin) {
        router.push('/admin');
      } else {
        // For now, redirect non-admin users to admin as well
        // Later you can create a user dashboard
        router.push('/admin');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return <div className="loading">Loading...</div>;
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    },
  };
}