import { MailIcon, MessageCircleMore } from "lucide-react"
import { FaFacebook, FaInstagram } from "react-icons/fa"

import Seo from "../components/Seo"
import { Button } from "../components/ui/button"
import settingsAsset from "../assets/img/settings_asset.jpg"
import {
  buildBreadcrumbJsonLd,
  buildPageJsonLd,
} from "../lib/seo"
import { useSiteMedia } from "../site/SiteMediaProvider"

const displayFont = {
  fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif',
}

export default function ContactPage() {
  const { getSlot } = useSiteMedia()
  const heroImage =
    getSlot("contact.hero")?.imageUrl ??
    getSlot("media.hero")?.imageUrl ??
    getSlot("gigs.hero")?.imageUrl ??
    settingsAsset
  const seoDescription =
    "Book Soundwalk for weddings, venues, parties and private events across the North East and wider North of England."

  return (
    <main className="overflow-hidden bg-[#050816] text-white">
      <Seo
        title="Contact Soundwalk | North East Wedding and Function Band"
        description={seoDescription}
        path="/contact"
        image={heroImage}
        jsonLd={[
          buildPageJsonLd({
            path: "/contact",
            name: "Contact Soundwalk | North East Wedding and Function Band",
            description: seoDescription,
            type: "ContactPage",
            image: heroImage,
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <section className="relative isolate min-h-[calc(100vh-6rem)] overflow-hidden">
        <img
          src={heroImage}
          alt="Soundwalk contact background"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.94)_6%,rgba(5,8,22,0.72)_42%,rgba(5,8,22,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,110,63,0.24),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(64,184,163,0.14),transparent_24%),radial-gradient(circle_at_65%_80%,rgba(255,255,255,0.08),transparent_22%)]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center px-6 py-16 sm:px-8 lg:px-12">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.34em] text-white/56">Contact</p>
              <h1
                className="mt-5 text-5xl leading-none font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-8xl"
                style={displayFont}
              >
                If you need a band, the email link should be the easy bit.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                Weddings, private events, venue bookings and function nights across the North East and wider North of
                England. Get in touch and we will come back to you.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="mailto:soundwalkband@gmail.com?subject=Soundwalk%20Enquiry"
                  className="inline-block"
                >
                  <Button className="h-12 rounded-full bg-white px-6 text-[#050816] shadow-[0_18px_45px_rgba(255,255,255,0.16)] hover:bg-white/92">
                    <MailIcon className="size-4" />
                    Send an Email
                  </Button>
                </a>

                <a
                  href="https://www.instagram.com/soundwalkband/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-white/18 bg-white/6 px-6 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                  >
                    <FaInstagram className="size-4" />
                    Instagram
                  </Button>
                </a>

                <a
                  href="https://facebook.com/Soundwalk-Cover-Band/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-white/18 bg-white/6 px-6 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                  >
                    <FaFacebook className="size-4" />
                    Facebook
                  </Button>
                </a>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/6 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:p-7">
              <div className="grid size-12 place-items-center rounded-full bg-white/10 text-white/90">
                <MessageCircleMore className="size-5" />
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.28em] text-white/46">Best Way To Reach Us</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Email first.</h2>
              <p className="mt-3 text-sm leading-7 text-white/66">
                The quickest route for bookings and enquiries is email. If you prefer, you can also message through socials.
              </p>
              <a
                href="mailto:soundwalkband@gmail.com?subject=Soundwalk%20Enquiry"
                className="mt-6 block text-lg font-medium text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
              >
                soundwalkband@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
