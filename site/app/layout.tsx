import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { FirebaseAnalytics } from "./components/FirebaseAnalytics";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  SOCIAL_IMAGE,
} from "./seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f7",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: HOME_DESCRIPTION,
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/favicon.png",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: new URL("/", metadataBase).toString(),
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: [
        {
          url: new URL(SOCIAL_IMAGE.url, metadataBase).toString(),
          alt: SOCIAL_IMAGE.alt,
        },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <FirebaseAnalytics />
      </body>
    </html>
  );
}
