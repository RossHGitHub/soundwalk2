export const SITE_MEDIA_SLOTS = [
  {
    key: "layout.logo",
    label: "Site Logo",
    description: "Used in the main site header and mobile nav.",
  },
  {
    key: "home.feature.musical-style",
    label: "Home Feature: Musical Style",
    description: "The first feature image on the home page.",
  },
  {
    key: "home.feature.silent-stage",
    label: "Home Feature: Silent Stage",
    description: "The second feature image on the home page.",
  },
  {
    key: "home.feature.pro-sound",
    label: "Home Feature: Pro Sound & Lighting",
    description: "The third feature image on the home page.",
  },
  {
    key: "home.band.ross",
    label: "Band Profile: Ross",
    description: "Profile image for Ross on the home page.",
  },
  {
    key: "home.band.keith",
    label: "Band Profile: Keith",
    description: "Profile image for Keith on the home page.",
  },
  {
    key: "home.band.barry",
    label: "Band Profile: Barry",
    description: "Profile image for Barry on the home page.",
  },
  {
    key: "gigs.hero",
    label: "Gigs Hero",
    description: "Hero image shown at the top of the gigs page.",
  },
  {
    key: "gigs.dialog",
    label: "Gig Details Image",
    description: "Image used in the public gig details modal.",
  },
  {
    key: "media.hero",
    label: "Media Hero",
    description: "Hero image shown at the top of the media page.",
  },
  {
    key: "contact.hero",
    label: "Contact Hero",
    description: "Hero image shown at the top of the contact page.",
  },
] as const;

export type SiteMediaSlotKey = (typeof SITE_MEDIA_SLOTS)[number]["key"];
