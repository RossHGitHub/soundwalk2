"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { GigList } from "../components/GigList"
import { Button } from "../components/ui/button"
import type { MediaItem } from "./admin/types"
import { useSiteMedia } from "../site/SiteMediaProvider"

type Gig = {
  _id?: string
  venue: string
  date: string
  startTime?: string
  description?: string
  fee?: number
  privateEvent?: boolean
  postersNeeded?: boolean
}

function groupGigsByYearAndMonth(gigs: Gig[]) {
  const grouped: { [year: string]: { [month: string]: Gig[] } } = {}
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  gigs.forEach((gig) => {
    const date = new Date(gig.date)
    const year = date.getFullYear().toString()
    const month = monthNames[date.getMonth()]

    if (!grouped[year]) {
      grouped[year] = {}
    }

    if (!grouped[year][month]) {
      grouped[year][month] = []
    }

    grouped[year][month].push(gig)
  })

  return grouped
}

function shuffleImages(items: MediaItem[]) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

const displayFont = {
  fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif',
}

export default function Gigs() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [visuals, setVisuals] = useState<string[]>([])
  const { getSlot } = useSiteMedia()

  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      setLoading(true)

      const gigsResult = await fetch("/api/gigs")
      const gigsData: Gig[] = await gigsResult.json()

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const publicAndFutureGigs = gigsData
        .filter((gig) => {
          const gigDate = new Date(gig.date)
          gigDate.setHours(0, 0, 0, 0)
          return !gig.privateEvent && gigDate >= today
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      if (!cancelled) {
        setGigs(publicAndFutureGigs)
      }

      try {
        const mediaResult = await fetch("/api/media")
        if (!mediaResult.ok) {
          throw new Error(`Failed to fetch media (${mediaResult.status})`)
        }

        const mediaData = (await mediaResult.json()) as MediaItem[]
        const imageItems = mediaData.filter(
          (item) => item.active && item.contentType?.startsWith("image/")
        )
        const randomised = shuffleImages(imageItems).map((item) => item.assetUrl)

        if (!cancelled) {
          setVisuals(randomised)
        }
      } catch (error) {
        console.error("Failed to load gigs visuals", error)
        if (!cancelled) {
          setVisuals([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPage()

    return () => {
      cancelled = true
    }
  }, [])

  const gigsData = groupGigsByYearAndMonth(gigs)
  const heroImage = getSlot("gigs.hero")?.imageUrl ?? null
  const nextGig = gigs[0] ?? null

  return (
    <main className="overflow-hidden bg-[#050816] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        {heroImage && (
          <img
            src={heroImage}
            alt="Soundwalk live on stage"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.94)_4%,rgba(5,8,22,0.72)_42%,rgba(5,8,22,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,110,63,0.28),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(64,184,163,0.16),transparent_24%),radial-gradient(circle_at_65%_80%,rgba(255,255,255,0.08),transparent_22%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-32 sm:px-8 sm:pt-36 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:px-12 lg:pb-24 lg:pt-32">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.34em] text-white/56">Upcoming Shows</p>
            <h1
              className="mt-5 text-5xl leading-none font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-8xl"
              style={displayFont}
            >
              Dates worth putting in the calendar.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              Upcoming public gigs, live dates and places to catch Soundwalk out in the wild.
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
                <Link to="/media">Watch the band</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
             
              <div className="rounded-[24px] border border-white/12 bg-white/6 p-5 backdrop-blur-sm grid-cols-3">
                <p className="text-xs uppercase tracking-[0.26em] text-white/45">Next Up</p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {nextGig ? nextGig.venue : "Date TBC"}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {nextGig ? new Date(nextGig.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : "More dates coming soon."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:grid-rows-[220px_180px] lg:pt-10">
          </div>
        </div>
      </section>
      <section className="px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="rounded-[34px] border border-white/10 bg-white/5 px-8 py-14 text-center text-white/64 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
              Loading upcoming gigs...
            </div>
          ) : gigs.length === 0 ? (
            <div className="rounded-[34px] border border-white/10 bg-white/5 px-8 py-14 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">Nothing Public Yet</p>
              <h2 className="mt-4 text-3xl font-semibold text-white" style={displayFont}>
                No public gigs booked yet.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/64">
                More dates will appear here as soon as they go live. In the meantime, head to the media page or get in touch.
              </p>
            </div>
          ) : (
            <GigList data={gigsData} visualPool={visuals} />
          )}
        </div>
      </section>
    </main>
  )
}
