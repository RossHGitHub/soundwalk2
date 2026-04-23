"use client"

import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react"

import { Button } from "./ui/button"
import { Card } from "./ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog"
import { formatDate } from "../lib/date"
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

type GigListProps = {
  data: {
    [year: string]: {
      [month: string]: Gig[]
    }
  }
  visualPool?: string[]
}

const accentTones = [
  "from-[#f56e3f]/25 via-[#0d1226]/55 to-[#050816]",
  "from-[#40b8a3]/18 via-[#0d1226]/55 to-[#050816]",
  "from-white/12 via-[#0d1226]/55 to-[#050816]",
]

const displayFont = {
  fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif',
}

export function GigList({ data, visualPool = [] }: GigListProps) {
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const { getSlot } = useSiteMedia()
  const dialogImage = getSlot("gigs.dialog")?.imageUrl ?? null
  let cardIndex = -1

  function getImageForIndex(index: number) {
    if (visualPool.length === 0) {
      return null
    }

    return visualPool[index % visualPool.length]
  }

  return (
    <>
      <div className="space-y-16">
        {Object.entries(data).map(([year, months]) => (
          <section key={year} className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <h2
                className="text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl"
                style={displayFont}
              >
                {year}
              </h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {Object.entries(months).map(([month, gigs], monthIndex) => (
              <div key={month} className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">Month</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{month}</h3>
                  </div>
                  <p className="text-sm text-white/46">
                    {gigs.length} {gigs.length === 1 ? "show" : "shows"}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {gigs.map((gig) => {
                    cardIndex += 1
                    const image = getImageForIndex(cardIndex)
                    const tone = accentTones[(cardIndex + monthIndex) % accentTones.length]

                    return (
                      <button
                        key={gig._id ?? `${gig.venue}-${gig.date}`}
                        type="button"
                        onClick={() => setSelectedGig(gig)}
                        className="group text-left"
                      >
                        <Card className="relative min-h-[320px] overflow-hidden rounded-[30px] border-white/10 bg-white/5 p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/18">
                          {image ? (
                            <img
                              src={image}
                              alt={gig.venue}
                              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className={`absolute inset-0 bg-gradient-to-br ${tone}`} />
                          )}

                          <div className={`absolute inset-0 bg-gradient-to-b ${tone}`} />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.08),rgba(5,8,22,0.82)_66%,rgba(5,8,22,0.96)_100%)]" />

                          <div className="relative flex h-full flex-col justify-between p-6">
                            <div className="flex items-start justify-between gap-4">
                              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-white/66">
                                Upcoming Show
                              </span>
                              <span className="rounded-full border border-white/14 bg-black/18 px-3 py-1 text-xs text-white/70">
                                {month}
                              </span>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h4 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                  {gig.venue}
                                </h4>
                                <p className="mt-2 text-sm leading-6 text-white/70">
                                  {gig.description || "Open the date for more details."}
                                </p>
                              </div>

                              <div className="space-y-2 text-sm text-white/74">
                                <div className="flex items-center gap-3">
                                  <CalendarDays className="size-4 text-white/58" />
                                  <span>{formatDate(gig.date)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Clock3 className="size-4 text-white/58" />
                                  <span>{gig.startTime || "Time TBC"}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-sm font-medium text-white">
                                View details
                                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>

      <Dialog open={!!selectedGig} onOpenChange={(open) => !open && setSelectedGig(null)}>
        <DialogContent className="h-[calc(100vh-1rem)] max-w-5xl overflow-hidden border-white/10 bg-[#08101f] p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,0.42)] sm:h-auto sm:max-h-[90vh] sm:rounded-[30px]">
          {selectedGig && (
            <div className="grid h-full overflow-y-auto rounded-[30px] lg:grid-cols-[1.02fr_0.98fr] lg:overflow-hidden">
              <div className="relative min-h-[220px] overflow-hidden lg:min-h-[620px]">
                {dialogImage || visualPool[0] ? (
                  <img
                    src={dialogImage ?? visualPool[0]}
                    alt="Soundwalk live"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),linear-gradient(145deg,rgba(18,28,52,1),rgba(7,9,16,1))]" />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.1),rgba(5,8,22,0.78)_100%)]" />
                <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
                  <span className="w-fit rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-white/66">
                    Upcoming Show
                  </span>
                  <DialogTitle
                    className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl"
                    style={displayFont}
                  >
                    {selectedGig.venue}
                  </DialogTitle>
                  <DialogDescription className="mt-3 max-w-md text-sm leading-7 text-white/70">
                    {selectedGig.description || "Live date details for this upcoming Soundwalk show."}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex flex-col bg-[linear-gradient(180deg,rgba(7,16,31,0.96),rgba(5,8,22,1))] p-6 pb-20 sm:p-8">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile
                    icon={<CalendarDays className="size-4" />}
                    label="Date"
                    value={formatDate(selectedGig.date)}
                  />
                  <InfoTile
                    icon={<Clock3 className="size-4" />}
                    label="Time"
                    value={selectedGig.startTime || "Time TBC"}
                  />
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-white/10 text-white/78">
                      <MapPin className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-white/42">Venue</p>
                      <p className="mt-1 text-lg font-semibold text-white">{selectedGig.venue}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/66">
                    {selectedGig.description ||
                      "More venue details will be added here where available. The date is live and ready for the diary."}
                  </p>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/4 p-5">
                  <p className="text-xs uppercase tracking-[0.26em] text-white/42">Good To Know</p>
                  <p className="mt-3 text-sm leading-7 text-white/64">
                    Times can occasionally change with the venue, so it is always worth checking socials closer to the date if you are making a trip specifically for the show.
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap gap-3 pt-8">
                  <Button
                    asChild
                    className="h-11 rounded-full bg-white px-5 text-[#050816] hover:bg-white/92"
                  >
                    <Link to="/contact">
                      Book the band
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedGig(null)}
                    className="h-11 rounded-full border-white/14 bg-transparent px-5 text-white hover:bg-white/8 hover:text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-white/58">
        {icon}
        <p className="text-xs uppercase tracking-[0.24em]">{label}</p>
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}
