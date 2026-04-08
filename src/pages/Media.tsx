import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog"
import { Separator } from "../components/ui/separator"
import Hero from "../components/Hero"
import type { MediaItem } from "./admin/types"
import { useSiteMedia } from "../site/SiteMediaProvider"

const promoVideos = [
  "https://www.youtube.com/embed/wwHEKfL651E?si=28PwT5ZpHAJwXz0u",
  "https://www.youtube.com/embed/2ikscZz02IA?si=jzdae4vbn9OlB8BG",
  "https://www.youtube.com/embed/bDGM6wwTBCo?si=cLQe99U3nIQHHWgf",
  "https://www.youtube.com/embed/NlvOox77Hbc?si=DG8HsmzLJIkVivo4",
  "https://www.youtube.com/embed/Z8PqptaAd-Y?si=r2AETkRokia9X5n6"
]

const liveVideos = [
  {
    title: "The Seven Stars, Ponteland",
    src: "https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2F61554854807963%2Fvideos%2F851406517140169%2F&show_text=false&width=560&t=0",
    width: 560,
    height: 314,
    orientation: "horizontal",
  },
  {
    title: "The Red Lion, Earsdon",
    src: "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2F61557765549373%2Fvideos%2F1404345156978439%2F&show_text=false&width=267&t=0",
    width: 267,
    height: 476,
    orientation: "vertical",
  },
  {
    title: "The Seven Stars, Ponteland",
    src: "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F578409781294117%2F&show_text=false&width=267&t=0",
    width: 267,
    height: 476,
    orientation: "vertical",
  }
]

export default function MediaPage() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  const { getSlot } = useSiteMedia()
  const heroImage = getSlot("media.hero")?.imageUrl ?? null
  void activeVideo

  useEffect(() => {
    let cancelled = false

    async function loadGallery() {
      try {
        const res = await fetch("/api/media")
        if (!res.ok) {
          throw new Error(`Failed to fetch media (${res.status})`)
        }

        const data = await res.json()
        if (!cancelled) {
          setGalleryItems(data)
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

  return (
    
    <main className="min-h-screen px-4 py-10 bg-background text-foreground">
      <div className="max-w-5xl mx-auto space-y-10 text-center">

        <Hero image={heroImage} title="Media" />

        <Separator />

        {/* Promo Videos */}
        <section aria-label="Promo Videos" className="text-left">
          <h2 className="text-2xl font-semibold mb-6 text-center">Promo Videos</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promoVideos.map((src, idx) => (
              <Dialog key={idx}>
                <DialogTrigger asChild>
                  <div
                    className="cursor-pointer rounded-xl border-2 border-emerald-600 overflow-hidden aspect-video"
                    onClick={() => setActiveVideo(src)}
                  >
                    <iframe
                      src={src}
                      title={`Promo Video ${idx + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="w-full h-full pointer-events-none"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black rounded-xl">
                  <iframe
                    src={src}
                    title={`Promo Video ${idx + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="w-full aspect-video"
                  />
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </section>

        {/* Live Snaps */}
        {/* Live Snaps */}
<section aria-label="Live Snaps" className="text-left space-y-6">
  <h2 className="text-2xl font-semibold text-center">Live Snaps</h2>
  <p className="text-muted-foreground text-center italic">
    Here are some clips of us that people have snapped in the wild!
  </p>

  {/* Unified grid for desktop */}
  <div className="hidden md:grid md:grid-cols-3 md:gap-6 md:justify-center max-w-5xl mx-auto">
    {liveVideos.map((vid, idx) => (
      <VideoCard
        key={idx}
        vid={vid}
        onClick={() => setActiveVideo(vid.src)}
        horizontal={vid.orientation === "horizontal"}
      />
    ))}
  </div>

  {/* Mobile layout: stack all videos */}
  <div className="block md:hidden space-y-10">
    {liveVideos.map((vid, idx) => (
      <VideoCard
        key={idx}
        vid={vid}
        onClick={() => setActiveVideo(vid.src)}
        horizontal={vid.orientation === "horizontal"}
      />
    ))}
  </div>
</section>

        <Separator />

        <section aria-label="Photo Gallery" className="text-left space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold">Photo Gallery</h2>
           
          </div>

          {galleryLoading ? (
            <p className="text-center text-muted-foreground">Loading gallery...</p>
          ) : galleryItems.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No gallery images are live yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryItems.map((item) => (
                <Dialog key={item._id}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="group overflow-hidden rounded-[24px] border border-emerald-700/40 bg-black/10 text-left shadow-[0_24px_50px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-emerald-500/60"
                    >
                      <div className="aspect-[4/5] overflow-hidden">
                        <img
                          src={item.assetUrl}
                          alt={item.altText || item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                      <div className="px-4 py-3">
                        
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl border-0 bg-black/90 p-0 text-white">
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
        </section>

      </div>
    </main>
  )
}

interface VideoCardProps {
  vid: {
    title: string;
    src: string;
    width: number;
    height: number;
  }
  onClick: () => void;
  horizontal: boolean;
}

function VideoCard({ vid, onClick, horizontal }: VideoCardProps) {
  // Use aspect-video for horizontal (16:9), and aspect-[9/16] for vertical (portrait)
  const aspectClass = horizontal ? "aspect-video" : "aspect-[9/16]"

  return (
    <div className="space-y-2 text-center max-w-full">
      <h3 className="text-xl font-medium">{vid.title}</h3>
      <Dialog>
        <DialogTrigger asChild>
          <div
            className={`cursor-pointer rounded-xl border-2 border-emerald-600 overflow-hidden max-w-full mx-auto ${aspectClass}`}
            onClick={onClick}
            style={{ maxWidth: vid.width }}
          >
            <iframe
              src={vid.src}
              scrolling="no"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              className="w-full h-full pointer-events-none"
              title={vid.title}
            />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black rounded-xl">
          <iframe
            src={vid.src}
            title={vid.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full aspect-video"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
