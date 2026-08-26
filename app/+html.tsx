import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Replaces Expo Router's default document shell so we can add PWA / iOS
// "Add to Home Screen" support — none of this is injected automatically by
// `expo export --platform web`.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#6f5947" />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZagoApp" />
      </head>
      <body>{children}</body>
    </html>
  );
}
