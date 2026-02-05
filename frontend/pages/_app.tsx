import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isAuthPage = ['/login', '/verify-2fa', '/reset'].includes(router.pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="app-container">
      {!isAuthPage && <Navbar />}
      <main className={isAuthPage ? 'auth-main' : 'main-content'}>
        <Component {...pageProps} />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default appWithTranslation(MyApp);