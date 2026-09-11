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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />

        <title>ZagoApp</title>
        <meta name="description" content="Organização da família Zago — afazeres, listas, pets e calendário." />

        {/* App privado: fora de buscador. O robots.txt cobre quem respeita o
            arquivo; esta meta cobre quem chega por link direto. */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <meta name="theme-color" content="#6f5947" />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZagoApp" />

        {/* Prévia quando alguém joga o link no grupo do WhatsApp. */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ZagoApp" />
        <meta property="og:title" content="ZagoApp" />
        <meta property="og:description" content="Nosso app da família." />
        <meta property="og:image" content="/icon-512.png" />
        <meta name="twitter:card" content="summary" />

        {/* O app pinta o próprio fundo; esta cor é só o que aparece atrás
            enquanto o bundle carrega, para não dar flash branco. */}
        <style dangerouslySetInnerHTML={{ __html: BOOT_STYLE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const BOOT_STYLE = `
  html, body { background-color: #2E2722; }
  @media (prefers-color-scheme: light) {
    html, body { background-color: #2E2722; }
  }
`;
