import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ListMusic,
  Banknote,
  ReceiptText,
  Images,
  Settings2,
  Menu,
  ArrowUpRight,
  LogOut,
  LayoutList,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetDescription,
} from "../../../components/ui/sheet";
import logo from "../../../assets/img/logo-Photoroom.png";
import type { AdminSection } from "../types";

const items = [
  {
    label: "Gig listings",
    key: "gigs-list",
    icon: LayoutList,
    group: "Live shows",
  },
  {
    label: "Calendar",
    key: "gigs-calendar",
    icon: CalendarDays,
    group: "Live shows",
  },
  {
    label: "Set list builder",
    key: "set-list-builder",
    icon: ListMusic,
    group: "Live shows",
  },
  {
    label: "Revenue",
    key: "payments-revenue",
    icon: Banknote,
    group: "Finances",
  },
  {
    label: "Payslips",
    key: "payments-payslips",
    icon: ReceiptText,
    group: "Finances",
  },
  {
    label: "Site images",
    key: "site-images",
    icon: Images,
    group: "Management",
  },
  { label: "Tools", key: "tools", icon: Settings2, group: "Management" },
] as const;

type Props = {
  activeSection: AdminSection;
  pageTitle: string;
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
};

export default function AdminMenuBar({
  activeSection,
  pageTitle,
  onSectionChange,
  onLogout,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = (mobile = false) => (
    <nav aria-label="Admin navigation" className="space-y-6">
      {["Live shows", "Finances", "Management"].map((group) => (
        <div key={group}>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">
            {group}
          </p>
          <div className="space-y-1">
            {items
              .filter((item) => item.group === group)
              .map(({ key, label, icon: Icon }) => {
                const button = (
                  <button
                    type="button"
                    aria-current={activeSection === key ? "page" : undefined}
                    onClick={() => onSectionChange(key)}
                    className={`admin-nav-item ${activeSection === key ? "is-active" : ""}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </button>
                );
                return mobile ? (
                  <SheetClose asChild key={key}>
                    {button}
                  </SheetClose>
                ) : (
                  <div key={key}>{button}</div>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
  const footer = (
    <div className="mt-8 space-y-2 border-t border-white/10 pt-4">
      <Link to="/" className="admin-nav-item">
        <ArrowUpRight size={18} />
        View website
      </Link>
      <button type="button" onClick={onLogout} className="admin-nav-item">
        <LogOut size={18} />
        Log out
      </button>
    </div>
  );
  return (
    <>
      <aside className="admin-sidebar">
        <Link to="/" aria-label="Soundwalk home">
          <img src={logo} alt="Soundwalk" className="mb-2 h-16 w-auto" />
        </Link>
        <p className="mb-10 px-3 text-[10px] uppercase tracking-[0.28em] text-white/45">
          Band workspace
        </p>
        {navigation()}
        {footer}
      </aside>
      <div className="admin-mobile-bar">
        <Link to="/" aria-label="Soundwalk home">
          <img
            src={logo}
            alt="Soundwalk"
            className="h-10 w-28 object-contain sm:w-36"
          />
        </Link>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex min-h-11 min-w-0 items-center gap-2 rounded-full border border-white/15 px-3 text-sm"
              aria-label="Open admin menu"
            >
              <span className="truncate">{pageTitle}</span>
              <Menu size={18} className="shrink-0" />
            </button>
          </SheetTrigger>
          <SheetContent className="admin-mobile-menu admin-theme w-[min(88vw,340px)] overflow-y-auto border-white/10 bg-[#090e20] text-white">
            <SheetHeader>
              <SheetTitle className="text-white">Band workspace</SheetTitle>
              <SheetDescription className="text-white/60">
                Everything behind the live show.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">
              {navigation(true)}
              {footer}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <nav className="admin-bottom-nav" aria-label="Quick navigation">
        {items.slice(0, 3).map(({ key, icon: Icon }, index) => (
          <button key={key} type="button" aria-current={activeSection === key ? "page" : undefined}
            onClick={() => onSectionChange(key)}>
            <Icon size={21} aria-hidden="true" />
            <span>{["Gigs", "Calendar", "Set lists"][index]}</span>
          </button>
        ))}
        <button type="button" aria-label="More admin sections" aria-haspopup="dialog" aria-expanded={menuOpen}
          aria-current={!items.slice(0, 3).some((item) => item.key === activeSection) ? "page" : undefined}
          onClick={() => setMenuOpen(true)}>
          <Menu size={21} aria-hidden="true" /><span>More</span>
        </button>
      </nav>
    </>
  );
}
