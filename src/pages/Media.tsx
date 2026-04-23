import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Play } from "lucide-react"

import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import type { MediaItem } from "./admin/types"
import { useSiteMedia } from "../site/SiteMediaProvider"

const promoVideos = [
  "https://www.youtube.com/embed/wwHEKfL651E?si=28PwT5ZpHAJwXz0u",
  "https://www.youtube.com/embed/2ikscZz02IA?si=jzdae4vbn9OlB8BG",
  "https://www.youtube.com/embed/bDGM6wwTBCo?si=cLQe99U3nIQHHWgf",
  "https://www.youtube.com/embed/NlvOox77Hbc?si=DG8HsmzLJIkVivo4",
  "https://www.youtube.com/embed/Z8PqptaAd-Y?si=r2AETkRokia9X5n6",
]

const liveVideos = [
  {
    title: "The Seven Stars, Ponteland",
    src: "https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2F61554854807963%2Fvideos%2F851406517140169%2F&show_text=false&width=560&t=0",
    width: 560,
    height: 314,
    orientation: "horizontal" as const,
  },
  {
    title: "The Red Lion, Earsdon",
    src: "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2F61557765549373%2Fvideos%2F1404345156978439%2F&show_text=false&width=267&t=0",
    width: 267,
    height: 476,
    orientation: "vertical" as const,
  },
  {
    title: "The Seven Stars, Ponteland",
    src: "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F578409781294117%2F&show_text=false&width=267&t=0",
    width: 267,
    height: 476,
    orientation: "vertical" as const,
  },
]

const displayFont = {
  fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif',
}

export default function MediaPage() {
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  const { getSlot } = useSiteMedia()
  const heroImage = getSlot("media.hero")?.imageUrl ?? null

  useEffect(() => {
    let cancelled = false

    async function loadGallery() {
      try {
        const res = await fetch("/api/media")
        if (!res.ok) {
          throw new Error(`Failed to fetch media (${res.status})`)
        }

        const data = (await res.json()) as MediaItem[]
        if (!cancelled) {
          setGalleryItems(data.filter((item) => item.active))
        }
      } catch (error) {
        console.error("Failed to load media gallery", error)
        if (!cancelled) {
          setGalleryItems([])
        }
      } finally {
        if (!cancelled) {
          setGalleryLoading(false)
        }
      }
    }

    loadGallery()

    return () => {
      cancelled = true
    }
  }, [])

  const imageItems = galleryItems.filter((item) => item.contentType?.startsWith("image/"))

  return (
    <main className="overflow-hidden bg-[#050816] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        {heroImage && (
          <img
            src={heroImage}
            alt="Soundwalk media hero"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.94)_4%,rgba(5,8,22,0.72)_42%,rgba(5,8,22,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,110,63,0.28),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(64,184,163,0.16),transparent_24%),radial-gradient(circle_at_65%_80%,rgba(255,255,255,0.08),transparent_22%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-32 sm:px-8 sm:pt-36 lg:grid-cols-[minmax(0,1.02fr)_420px] lg:px-12 lg:pb-24 lg:pt-32">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.34em] text-white/56">Media</p>
            <h1
              className="mt-5 text-5xl leading-none font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-8xl"
              style={displayFont}
            >
              See the band before you book the night.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              Promo videos, live clips and photo gallery shots that show what Soundwalk actually feels like in the room.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-6 text-[#050816] shadow-[0_18px_45px_rgba(255,255,255,0.16)] hover:bg-white/92"
              >
                <Link to="/contact">
                  Book / Enquire
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/18 bg-white/6 px-6 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
              >
                <Link to="/gigs">Upcoming gigs</Link>
              </Button>
            </div>
          </div>

        </div>
      </section>
      <section className="px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl space-y-16">
          <MediaSectionHeader
            eyebrow="Promo Videos"
            title="Clips we put together."
            body=""
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {promoVideos.map((src, index) => (
              <VideoDialogCard
                key={src}
                title={`Promo Video ${index + 1}`}
                src={src}
                aspectClass="aspect-video"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[linear-gradient(180deg,#081426_0%,#06101e_100%)] px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl space-y-12">
          <MediaSectionHeader
            eyebrow="Live Snaps"
            title="The stuff people caught in the wild."
            body=""
          />

          <div className="grid gap-6 md:grid-cols-3">
            {liveVideos.map((vid) => (
              <LiveVideoCard key={`${vid.title}-${vid.src}`} vid={vid} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl space-y-12">
          <MediaSectionHeader
            eyebrow="Photo Gallery"
            title="Stage shots, live frames and moments from the room."
            body="Open any image for the full-size view."
          />

          {galleryLoading ? (
            <div className="rounded-[34px] border border-white/10 bg-white/5 px-8 py-14 text-center text-white/64 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
              Loading gallery...
            </div>
          ) : imageItems.length === 0 ? (
            <div className="rounded-[34px] border border-white/10 bg-white/5 px-8 py-14 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">No Gallery Yet</p>
              <h2 className="mt-4 text-3xl font-semibold text-white" style={displayFont}>
                No gallery images are live yet.
              </h2>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {imageItems.map((item) => (
                <Dialog key={item._id ?? item.assetUrl}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.26)] transition duration-300 hover:-translate-y-1 hover:border-white/18"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <img
                          src={item.assetUrl}
                          alt={item.altText || item.title}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.02),rgba(5,8,22,0.42)_76%,rgba(5,8,22,0.8)_100%)]" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <p className="text-xs uppercase tracking-[0.28em] text-white/48">Photo</p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {item.title || item.altText || "Soundwalk"}
                          </p>
                        </div>
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl border-white/10 bg-black/94 p-0 text-white sm:rounded-[28px]">
                    <img
                      src={item.assetUrl}
                      alt={item.altText || item.title}
                      className="max-h-[85vh] w-full object-contain"
                    />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function MediaSectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.34em] text-[#f4a67d]">{eyebrow}</p>
        <h2
          className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.03em] text-white sm:text-5xl"
          style={displayFont}
        >
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-sm leading-7 text-white/66 sm:text-base">{body}</p>
    </div>
  )
}

function VideoDialogCard({
  title,
  src,
  aspectClass,
}: {
  title: string
  src: string
  aspectClass: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.26)] transition duration-300 hover:-translate-y-1 hover:border-white/18"
        >
          <div className={`relative overflow-hidden ${aspectClass}`}>
            <iframe
              src={src}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full pointer-events-none"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0)_40%,rgba(5,8,22,0.78)_100%)]" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/48">Promo Video</p>
                <p className="mt-2 text-lg font-semibold text-white">{title}</p>
              </div>
              <div className="grid size-12 place-items-center rounded-full border border-white/16 bg-white/10 text-white">
                <Play className="ml-0.5 size-4" />
              </div>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl overflow-hidden border-white/10 bg-black p-0 text-white sm:rounded-[28px]">
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full aspect-video"
        />
      </DialogContent>
    </Dialog>
  )
}

function LiveVideoCard({
  vid,
}: {
  vid: {
    title: string
    src: string
    width: number
    height: number
    orientation: "horizontal" | "vertical"
  }
}) {
  const aspectClass = vid.orientation === "horizontal" ? "aspect-video" : "aspect-[9/16]"
  const contentClass =
    vid.orientation === "horizontal"
      ? "md:col-span-2 xl:col-span-1"
      : ""

  return (
    <div className={contentClass}>
      <VideoDialogCard title={vid.title} src={vid.src} aspectClass={aspectClass} />
      <p className="mt-4 text-sm font-medium text-white">{vid.title}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/42">
        {vid.orientation === "horizontal" ? "Live Clip" : "Vertical Snap"}
      </p>
    </div>
  )
}
