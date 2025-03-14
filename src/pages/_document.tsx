import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>ACM at UAB Raw Image Viewer</title>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="description" content="RAW Image Viewer by ACM at UAB" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
