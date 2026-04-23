import { useEffect, useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import {
  Calendar,
  Home,
  Instagram,
  Menu,
  Phone,
  Video,
} from "lucide-react"
import { FaFacebook } from "react-icons/fa"

import { Button } from "./ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import { cn } from "../lib/utils"
import logoTransparent from "../assets/img/logo-Photoroom.png"
import { SiteMediaProvider, useSiteMedia } from "../site/SiteMediaProvider"

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Gigs", path: "/gigs", icon: Calendar },
  { name: "Media", path: "/media", icon: Video },
  { name: "Contact", path: "/contact", icon: Phone },
]

const mobileNavDescriptions: Record<string, string> = {
  "/": "Start here",
  "/gigs": "Dates and shows",
  "/media": "Watch and listen",
  "/contact": "Bookings and enquiries",
}

function SiteLogo({
  logoUrl,
  isHome,
  scrolled,
  mobile = false,
}: {
  logoUrl: string
  isHome: boolean
  scrolled: boolean
  mobile?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logoUrl}
        alt="Soundwalk logo"
        className={cn(
          "w-auto object-contain transition-all duration-500",
          mobile
            ? "h-12"
            : isHome && !scrolled
              ? "h-16 sm:h-[4.5rem] lg:h-24"
              : "h-[3.25rem] sm:h-[3.75rem] lg:h-20"
        )}
      />
      {!mobile && (
        <div className="hidden lg:block">
          <p className="text-xs uppercase tracking-[0.34em] text-white/45">North-East Live Band</p>
          <p className="mt-1 text-sm text-white/72">Weddings, functions, venues</p>
        </div>
      )}
    </div>
  )
}

function LayoutShell() {
  const location = useLocation()
  const { getSlot } = useSiteMedia()
  const logoUrl = getSlot("layout.logo")?.imageUrl || logoTransparent
  const isHome = location.pathname === "/"
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ScrollToTop />

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 px-3 transition-all duration-500 sm:px-5",
          isHome && !scrolled ? "pt-3 sm:pt-5" : "pt-2.5 sm:pt-3"
        )}
      >
        <div className="mx-auto max-w-7xl">
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-[24px] border px-3.5 py-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-500 sm:gap-4 sm:rounded-[28px] sm:px-6 sm:py-3",
              isHome && !scrolled
                ? "border-white/10 bg-[rgba(5,8,22,0.38)] text-white"
                : "border-white/12 bg-[rgba(5,8,22,0.82)] text-white"
            )}
          >
            <Link to="/" className="shrink-0">
              <SiteLogo logoUrl={logoUrl} isHome={isHome} scrolled={scrolled} />
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map(({ name, path }) => (
                <NavLink
                  key={name}
                  to={path}
                  className={({ isActive }) =>
                    cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-white text-[#050816]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )
                  }
                >
                  {name}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <a
                href="https://www.instagram.com/soundwalkband/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "transition",
                  "text-white/62 hover:text-white"
                )}
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61557765549373"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "transition",
                  "text-white/62 hover:text-white"
                )}
              >
                <FaFacebook className="size-5" />
              </a>
              <Button
                asChild
                className={cn(
                  "rounded-full px-5",
                  "bg-white text-[#050816] hover:bg-white/92"
                )}
              >
                <Link to="/contact">Book / Enquire</Link>
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full md:hidden",
                    "text-white hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>

            <SheetContent
                side="right"
                className="w-[88vw] border-l-white/10 bg-[rgba(5,8,22,0.98)] px-0 text-white sm:max-w-xs"
              >
                <SheetHeader className="px-6 pt-12 pb-4 text-left">
                  <div className="flex items-center justify-start">
                    <SiteLogo logoUrl={logoUrl} isHome={isHome} scrolled={scrolled} mobile />
                  </div>
                  <SheetTitle className="mt-4 text-2xl text-white">Soundwalk</SheetTitle>
                  <SheetDescription className="max-w-[18rem] text-sm leading-6 text-white/60">
                    Weddings, functions, venues and nights out.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex h-full flex-col px-4 pb-6">
                  <div className="space-y-2">
                    {navItems.map(({ name, path, icon: Icon }) => (
                      <SheetClose asChild key={name}>
                        <Link
                          to={path}
                          className={cn(
                            "flex w-full items-center gap-4 rounded-[22px] border px-4 py-4 text-left transition",
                            location.pathname === path
                              ? "border-white bg-white text-[#050816]"
                              : "border-white/10 bg-white/[0.03] text-white/74 hover:bg-white/8 hover:text-white"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
                              location.pathname === path ? "bg-[#050816]/10" : "bg-white/8"
                            )}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xl font-semibold leading-none">{name}</p>
                            <p
                              className={cn(
                                "mt-2 text-xs uppercase tracking-[0.22em]",
                                location.pathname === path ? "text-[#050816]/65" : "text-white/42"
                              )}
                            >
                              {mobileNavDescriptions[path]}
                            </p>
                          </div>
                        </Link>
                      </SheetClose>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/42">Get In Touch</p>
                    <p className="mt-3 text-sm leading-6 text-white/62">
                      Looking for a band for a wedding, party, venue or function night?
                    </p>
                    <SheetClose asChild>
                      <Button asChild className="mt-4 h-11 w-full rounded-full bg-white text-[#050816] hover:bg-white/92">
                        <Link to="/contact">Book / Enquire</Link>
                      </Button>
                    </SheetClose>
                  </div>

                  <div className="mt-auto px-2 pt-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/38">Follow</p>
                    <div className="mt-4 flex items-center gap-4 text-white/64">
                      <a
                        href="https://www.instagram.com/soundwalkband/"
                        aria-label="Instagram"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-white"
                      >
                        <Instagram className="size-5" />
                      </a>
                      <a
                        href="https://www.facebook.com/profile.php?id=61557765549373"
                        aria-label="Facebook"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-white"
                      >
                        <FaFacebook className="size-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className={cn("flex-1", isHome ? "" : "pt-24 md:pt-28")}>
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-[#050816] px-6 py-10 text-white sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div className="space-y-4 text-center md:text-left">
            <Link to="/" className="inline-flex justify-center md:justify-start">
              <img src={logoUrl} alt="Soundwalk logo" className="h-20 w-auto object-contain" />
            </Link>
            <p className="mx-auto max-w-xl text-sm leading-7 text-white/62 md:mx-0">
              Soundwalk is a North-East covers and functions band for weddings, venues, parties and private events
              across the North of England.
            </p>
            <div className="flex items-center justify-center gap-4 text-white/64 md:justify-start">
              <a
                href="https://www.instagram.com/soundwalkband/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61557765549373"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                <FaFacebook className="size-5" />
              </a>
            </div>
          </div>

          <div className="grid gap-6 text-center sm:grid-cols-2 md:text-left">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">Explore</p>
              <div className="mt-4 space-y-3">
                {navItems.map(({ name, path }) => (
                  <Link key={name} to={path} className="block text-sm text-white/68 transition hover:text-white">
                    {name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">Credits</p>
              <p className="mt-4 text-sm leading-7 text-white/62">
                Pictures courtesy of Eliza Henderson and{" "}
                <a
                  href="https://www.instagram.com/fraser_photography444/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-white/30 underline-offset-4 transition hover:text-white"
                >
                  Fraser Farnan
                </a>
                .
              </p>
              <Link
                to="/admin"
                className="mt-3 inline-block text-xs uppercase tracking-[0.24em] text-white/42 transition hover:text-white"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Layout() {
  return (
    <SiteMediaProvider>
      <LayoutShell />
    </SiteMediaProvider>
  )
}
