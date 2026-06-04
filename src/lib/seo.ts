export const SITE_NAME = "Soundwalk";
export const SITE_URL = "https://soundwalk.uk";
export const DEFAULT_OG_TYPE = "website";
export const DEFAULT_LOCALE = "en_GB";
export const INSTAGRAM_URL = "https://www.instagram.com/soundwalkband/";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61557765549373";
export const CONTACT_EMAIL = "soundwalkband@gmail.com";

const SERVICE_AREAS = [
  "Newcastle",
  "Northumberland",
  "North East England",
  "Sunderland",
  "Durham",
];

const PERFORMANCE_TYPES = [
  "Wedding band",
  "Function band",
  "Cover band",
  "Live band",
  "Party band",
  "Corporate event band",
  "Pub band",
];

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

type FaqItem = {
  question: string;
  answer: string;
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
    genre: PERFORMANCE_TYPES,
    keywords: [
      "wedding band Newcastle",
      "wedding band Northumberland",
      "wedding band North East",
      "function band Newcastle",
      "function band Northumberland",
      "function band North East",
      "cover band Newcastle",
      "cover band North East",
      "band for birthday party",
      "live music for pub night",
      "cover band for wedding evening do",
    ],
    knowsAbout: PERFORMANCE_TYPES,
    areaServed: SERVICE_AREAS.map((name) => ({
      "@type": "Place",
      name,
    })),
    makesOffer: PERFORMANCE_TYPES.map((name) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name,
        areaServed: SERVICE_AREAS.map((areaName) => ({
          "@type": "Place",
          name: areaName,
        })),
      },
    })),
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

export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
