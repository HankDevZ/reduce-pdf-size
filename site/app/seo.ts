import type { Metadata } from "next";

export const SITE_NAME = "Reduce PDF Size";
export const HOME_TITLE =
  "Reduce PDF Size Online Free — Private PDF Compressor";
export const HOME_DESCRIPTION =
  "Reduce PDF file size in your browser for free. Choose a compression level, keep your files private, and download a smaller PDF without uploading it.";
export const MAINTAINER_NAME = "HankDevZ";
export const MAINTAINER_GITHUB = "https://github.com/HankDevZ";
export const SITE_PUBLISHED_DATE = "2026-08-01";
export const SITE_MODIFIED_DATE = "2026-08-01";
export const SITE_DATE_LABEL = "August 1, 2026";

export const SOCIAL_IMAGE = {
  url: "/og.png",
  width: 1730,
  height: 909,
  type: "image/png",
  alt: "Reduce PDF Size — a large PDF becoming a smaller PDF in the browser.",
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: PageMetadataOptions): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: path,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [
        {
          url: SOCIAL_IMAGE.url,
          alt: SOCIAL_IMAGE.alt,
        },
      ],
    },
  };
}
