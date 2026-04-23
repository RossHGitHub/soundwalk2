export const SITE_NAME = "Soundwalk";
export const SITE_URL = "https://soundwalk.uk";
export const DEFAULT_OG_TYPE = "website";
export const DEFAULT_LOCALE = "en_GB";
export const INSTAGRAM_URL = "https://www.instagram.com/soundwalkband/";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61557765549373";
export const CONTACT_EMAIL = "soundwalkband@gmail.com";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type MusicGroupJsonLdOptions = {
  description: string;
  image?: string | null;
  logo?: string | null;
};

type PageJsonLdOptions = {
  path: string;
  name: string;
  description: string;
  type?: string;
  image?: string | null;
};

export function toAbsoluteUrl(url?: string | null) {
  if (!url) {
    return undefined;
  }

  return new URL(url, SITE_URL).toString();
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-GB",
  };
}

export function buildMusicGroupJsonLd({
  description,
  image,
  logo,
}: MusicGroupJsonLdOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": `${SITE_URL}/#musicgroup`,
    name: SITE_NAME,
    url: SITE_URL,
    description,
    email: CONTACT_EMAIL,
    image: toAbsoluteUrl(image),
    logo: toAbsoluteUrl(logo),
    genre: ["Cover band", "Wedding band", "Function band", "Live band"],
    areaServed: [
      {
        "@type": "Place",
        name: "North East England",
      },
      {
        "@type": "Place",
        name: "North of England",
      },
    ],
    sameAs: [INSTAGRAM_URL, FACEBOOK_URL],
  };
}

export function buildPageJsonLd({
  path,
  name,
  description,
  type = "WebPage",
  image,
}: PageJsonLdOptions) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${toAbsoluteUrl(path)}#webpage`,
    url: toAbsoluteUrl(path),
    name,
    description,
    inLanguage: "en-GB",
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#musicgroup`,
    },
    primaryImageOfPage: toAbsoluteUrl(image),
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}
