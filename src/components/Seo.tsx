import { useEffect } from "react";

import {
  DEFAULT_LOCALE,
  DEFAULT_OG_TYPE,
  SITE_NAME,
  SITE_URL,
  toAbsoluteUrl,
} from "../lib/seo";

type SeoProps = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: string;
  robots?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

function upsertMeta(
  key: "name" | "property",
  value: string,
  content?: string | undefined
) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(key, value);
    document.head.appendChild(element);
  }

  if (content) {
    element.setAttribute("content", content);
  }
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function removeMeta(key: "name" | "property", value: string) {
  document.head.querySelector(`meta[${key}="${value}"]`)?.remove();
}

export default function Seo({
  title,
  description,
  path,
  image,
  type = DEFAULT_OG_TYPE,
  robots = "index,follow",
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const canonicalUrl = new URL(path, SITE_URL).toString();
    const absoluteImage = toAbsoluteUrl(image);

    document.title = title;
    document.documentElement.lang = "en-GB";

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", DEFAULT_LOCALE);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("name", "twitter:card", absoluteImage ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);

    if (absoluteImage) {
      upsertMeta("property", "og:image", absoluteImage);
      upsertMeta("name", "twitter:image", absoluteImage);
    } else {
      removeMeta("property", "og:image");
      removeMeta("name", "twitter:image");
    }

    upsertLink("canonical", canonicalUrl);

    document.head
      .querySelectorAll('script[data-seo-json-ld="true"]')
      .forEach((element) => element.remove());

    const payloads = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

    payloads.forEach((payload) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoJsonLd = "true";
      script.textContent = JSON.stringify(payload);
      document.head.appendChild(script);
    });
  }, [description, image, jsonLd, path, robots, title, type]);

  return null;
}
