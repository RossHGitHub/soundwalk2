// src/pages/MediaPage.tsx

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/Dialog"
import { Separator } from "../components/ui/separator"

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
    width: "560",
    height: "314"
  },
  {
    title: "The Red Lion, Earsdon",
    src: "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2F61557765549373%2Fvideos%2F1404345156978439%2F&show_text=false&width=267&t=0",
    width: "267",
    height: "476"
  },
  {
    title: "The Seven Stars, Ponteland",
    src: "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F578409781294117%2F&show_text=false&width=267&t=0",
    width: "267",
    height: "476"
  }
]

export default function MediaPage() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  return (
    <main className="min-h-screen px-4 py-10 bg-background text-foreground">
      <div className="max-w-5xl mx-auto space-y-10 text-center">

        <section className="space-y-2">
          <h1 className="text-4xl font-bold">Media</h1>
          <p className="text-muted-foreground">Watch clips and live performances from Soundwalk</p>
        </section>

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
        <section aria-label="Live Snaps" className="text-left space-y-6">
          <h2 className="text-2xl font-semibold text-center">Live Snaps</h2>
          <p className="text-muted-foreground text-center italic">
            Here are some clips of us that people have snapped in the wild!
          </p>

          <div className="grid gap-10 place-items-center">
            {liveVideos.map((vid, idx) => (
              <div key={idx} className="space-y-2 text-center">
                <h3 className="text-xl font-medium">{vid.title}</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <div
                      className="cursor-pointer rounded-xl border-2 border-emerald-600 overflow-hidden"
                      onClick={() => setActiveVideo(vid.src)}
                      style={{ width: vid.width + "px", height: vid.height + "px" }}
                    >
                      <iframe
                        src={vid.src}
                        width={vid.width}
                        height={vid.height}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        className="w-full h-full pointer-events-none"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black rounded-xl">
                    <iframe
                      src={vid.src}
                      title={`Live Video ${idx + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="w-full aspect-video"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
