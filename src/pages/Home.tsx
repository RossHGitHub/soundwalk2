import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  AudioWaveform,
  CalendarDays,
  Disc3,
  Sparkles,
} from "lucide-react"

import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import Seo from "../components/Seo"
import promoVideo from "../assets/vid/soundwalkPromo.mp4"
import { cn } from "../lib/utils"
import {
  buildBreadcrumbJsonLd,
  buildMusicGroupJsonLd,
  buildPageJsonLd,
  buildWebsiteJsonLd,
} from "../lib/seo"
import { useSiteMedia } from "../site/SiteMediaProvider"

const artists = [
  "The Turtles",
  "Jackie Wilson",
  "The Weeknd",
  "Harry Styles",
  "Girls Aloud",
  "Stereophonics",
  "Coldplay",
  "Walk The Moon",
  "Kaiser Chiefs",
  "Van Morrison",
  "Bastille",
  "The Who",
  "Weezer",
  "R.E.M.",
  "Jet",
  "Deep Blue Something",
]

const bandMembers = [
  {
    name: "Ross",
    role: "Guitar, vocals, arrangements",
    slot: "home.band.ross" as const,
    copy: "Leads the front line, shapes the set, and keeps the whole thing moving.",
  },
  {
    name: "Keith",
    role: "Bass, vocals, low-end authority",
    slot: "home.band.keith" as const,
    copy: "Brings the weight, the harmonies, and the sort of confidence only a great bassist gets away with.",
  },
  {
    name: "Barry",
    role: "Drums, timing, controlled chaos",
    slot: "home.band.barry" as const,
    copy: "Decades deep in live rooms, with the feel to keep a packed floor locked in.",
  },
]

const displayFont = {
  fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif',
}

function PhotoPanel({
  image,
  title,
  body,
  className,
}: {
  image: string | null
  title: string
  body: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      {image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),linear-gradient(145deg,rgba(14,24,45,0.92),rgba(4,8,20,1))]" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.05),rgba(5,8,22,0.82)_65%,rgba(5,8,22,0.96))]" />
      <div className="relative flex h-full min-h-[220px] flex-col justify-end p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/55">Soundwalk Live</p>
        <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/72">{body}</p>
      </div>
    </div>
  )
}

function GlassCard({
  icon,
  eyebrow,
  title,
  body,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <Card className="gap-0 rounded-[28px] border-white/12 bg-white/6 p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="grid size-11 place-items-center rounded-full bg-white/10 text-white/90">
          {icon}
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/45">{eyebrow}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
        </div>
      </div>
      <p className="px-5 py-5 text-sm leading-6 text-white/68">{body}</p>
    </Card>
  )
}

function BandCard({
  name,
  role,
  copy,
  image,
}: {
  name: string
  role: string
  copy: string
  image: string | null
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-[30px] border-white/10 bg-white/5 p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-sm">
      <div className="relative aspect-[4/5] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`${name} of Soundwalk`}
            className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%),linear-gradient(145deg,rgba(18,28,52,1),rgba(7,9,16,1))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0)_25%,rgba(5,8,22,0.82)_100%)]" />
        {!image && (
          <div className="absolute inset-0 grid place-items-center text-5xl font-semibold text-white/70">
            {name.slice(0, 1)}
          </div>
        )}
      </div>

      <div className="space-y-3 px-6 py-6">
        <div>
          <h3 className="text-2xl font-semibold">{name}</h3>
          <p className="mt-1 text-sm uppercase tracking-[0.28em] text-white/48">{role}</p>
        </div>
        <p className="text-sm leading-6 text-white/72">{copy}</p>
      </div>
    </Card>
  )
}

export default function HomePage() {
  const { getSlot } = useSiteMedia()

  const musicalStyleImg = getSlot("home.feature.musical-style")?.imageUrl ?? null
  const silentStageImg = getSlot("home.feature.silent-stage")?.imageUrl ?? null
  const proSoundImg = getSlot("home.feature.pro-sound")?.imageUrl ?? null
  const logoImage = getSlot("layout.logo")?.imageUrl ?? null
  const seoImage = musicalStyleImg ?? silentStageImg ?? proSoundImg ?? getSlot("media.hero")?.imageUrl ?? null
  const seoDescription =
    "Soundwalk are a North East cover band for weddings, functions, venues and private events across the North of England, with varied sets, silent stage options and pro sound."

  return (
    <main className="overflow-hidden bg-[#050816] text-white">
      <Seo
        title="Soundwalk | North East Cover Band for Weddings and Functions"
        description={seoDescription}
        path="/"
        image={seoImage}
        jsonLd={[
          buildWebsiteJsonLd(),
          buildMusicGroupJsonLd({
            description: seoDescription,
            image: seoImage,
            logo: logoImage,
          }),
          buildPageJsonLd({
            path: "/",
            name: "Soundwalk | North East Cover Band for Weddings and Functions",
            description: seoDescription,
            image: seoImage,
          }),
          buildBreadcrumbJsonLd([{ name: "Home", path: "/" }]),
        ]}
      />
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <video
          src={promoVideo}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          Your browser does not support the video tag.
        </video>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.94)_5%,rgba(5,8,22,0.68)_42%,rgba(5,8,22,0.84)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,110,63,0.34),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(64,184,163,0.18),transparent_22%),radial-gradient(circle_at_56%_82%,rgba(162,116,255,0.14),transparent_24%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl gap-12 px-6 pb-14 pt-32 sm:px-8 sm:pb-16 sm:pt-36 lg:grid-cols-[minmax(0,1.2fr)_380px] lg:items-end lg:px-12 lg:pb-18 lg:pt-28">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.36em] text-white/58">
              North-East based functions and covers band
            </p>
            <h1
              className="mt-5 max-w-4xl text-5xl leading-none font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-8xl"
              style={displayFont}
            >
              A North-East live band for weddings, functions and proper nights out.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/74 sm:text-lg">
              From classics to modern hits, Soundwalk is a North-East cover band for weddings, functions, venues and
              private events across the North of England, with a live setup that can be tailored to the room.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-7 text-white/92 sm:text-xl">
              Give your night the soundtrack it deserves.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-6 text-[#050816] shadow-[0_18px_45px_rgba(255,255,255,0.18)] hover:bg-white/92"
              >
                <Link to="/gigs">
                  Upcoming gigs
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/20 bg-white/6 px-6 text-white backdrop-blur-sm hover:bg-white/12 hover:text-white"
              >
                <Link to="/media">Watch the band</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-xs uppercase tracking-[0.26em] text-white/58 sm:text-sm">
              {["Musical variety", "Silent stage options", "Professional sound & lighting", "Weddings and functions"].map((item) => (
                <span key={item} className="rounded-full border border-white/14 bg-white/6 px-4 py-2 backdrop-blur-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:pb-3">
            <Card className="gap-0 rounded-[30px] border-white/12 bg-white/8 p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-sm">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-[0.65rem] uppercase tracking-[0.34em] text-white/45">Where Soundwalk Fits</p>
              </div>
              <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                {[
                  ["Weddings", "A modern set with big moments for the room"],
                  ["Functions", "Flexible live music for mixed crowds and different venues"],
                  ["Bars", "A proper live feel without leaning on the same old standards"],
                  ["Events", "Clean FoH integration when in-house production is involved"],
                ].map(([title, body]) => (
                  <div key={title} className="bg-[rgba(5,8,22,0.72)] px-5 py-5">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/62">{body}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Musical Style", "Classics to modern hits"],
                ["Silent Stage", "Precise volume control"],
                ["PA & Lighting", "Self-contained and FoH-ready"],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[24px] border border-white/12 bg-white/7 px-4 py-4 text-center backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/48">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[linear-gradient(180deg,#07101f_0%,#081426_100%)] px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.34em] text-[#8ccbc3]">Why Choose Soundwalk?</p>
            <h2
              className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.03em] text-white sm:text-5xl"
              style={displayFont}
            >
              Give your night the soundtrack it deserves.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/72">
              Gone are the days where the over-played rock classics are enough to satisfy everyone in the room. We
              offer a fantastic variety of musical styles, from classics to modern hits, alongside a stage setup that
              can be tailored to suit the venue.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:grid-rows-[240px_200px]">
            <PhotoPanel
              image={musicalStyleImg}
              title="Musical Style"
              body="A fantastic variety of songs, from classics to modern hits, built to keep the whole room with us."
              className="sm:row-span-2"
            />
            <PhotoPanel
              image={silentStageImg}
              title="Silent Stage"
              body="Electronic drums and in-ear monitoring let us tailor the volume to the room when control matters."
            />
            <PhotoPanel
              image={proSoundImg}
              title="Professional Sound & Lighting"
              body="We bring the PA, lighting and clean signal splitting needed for seamless FoH integration."
            />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.34em] text-[#f4a67d]">Artists We Play</p>
              <h2
                className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.03em] text-white sm:text-5xl"
                style={displayFont}
              >
                Just some of the artists in the set.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/66 sm:text-base">
              The list, quite literally, goes on and on, but this gives you a feel for the kind of range we bring to a
              night.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {artists.map((artist) => (
              <span
                key={artist}
                className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/78 backdrop-blur-sm"
              >
                {artist}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <GlassCard
              icon={<Disc3 className="size-5" />}
              eyebrow="Musical Style"
              title="Built for a mixed room"
              body="From weddings to functions, we aim for a set that feels broad, current and strong from start to finish."
            />
            <GlassCard
              icon={<AudioWaveform className="size-5" />}
              eyebrow="Silent Stage"
              title="Tailored to the venue"
              body="Our primary setup uses electronic drums and in-ear monitoring to keep volume precise where the room demands it."
            />
            <GlassCard
              icon={<Sparkles className="size-5" />}
              eyebrow="Professional Sound"
              title="Ready for bigger setups too"
              body="For larger venues, our splitter system sends a clean feed to FoH while we keep full control of our monitoring."
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.34em] text-[#8ccbc3]">Meet Soundwalk</p>
              <h2
                className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.03em] text-white sm:text-5xl"
                style={displayFont}
              >
                Three players. Big sound. Built for a proper night.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/66 sm:text-base">
              A tight three-piece setup with the range and flexibility to handle weddings, functions and live venues.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {bandMembers.map((member) => (
              <BandCard
                key={member.name}
                name={member.name}
                role={member.role}
                copy={member.copy}
                image={getSlot(member.slot)?.imageUrl ?? null}
              />
            ))}
          </div>

          <div className="mt-12 rounded-[34px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.34em] text-white/46">Need A Date?</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl" style={displayFont}>
                  Give your night the soundtrack it deserves.
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
                  Have a look around, watch the band in action, or get in touch for weddings, private events and venue
                  bookings.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-white px-6 text-[#050816] hover:bg-white/92"
                >
                  <Link to="/contact">
                    Contact the band
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/16 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/gigs">
                    <CalendarDays className="size-4" />
                    Upcoming shows
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/16 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/media">
                    <Disc3 className="size-4" />
                    Media
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
