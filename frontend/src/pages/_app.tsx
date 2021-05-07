import 'tailwindcss/tailwind.css';
import { FC } from 'react';

function MyApp({ Component, pageProps }: { Component: FC; pageProps: Record<string, unknown> }) {
  return <Component {...pageProps} />;
}

export default MyApp;
