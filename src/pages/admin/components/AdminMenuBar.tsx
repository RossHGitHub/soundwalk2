import { Button } from "../../../components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "../../../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "../../../components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import type { AdminSection } from "../types";

type Props = {
  activeSection: AdminSection;
  isGigsSection: boolean;
  pageTitle: string;
  onSectionChange: (section: AdminSection) => void;
};

export default function AdminMenuBar({
  activeSection,
  isGigsSection,
  pageTitle,
  onSectionChange,
}: Props) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-gray-950/70 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs uppercase tracking-[0.22em] text-white/50">
          Menu
        </div>
        <div className="flex items-center gap-3 sm:hidden">
          <span className="text-sm text-white/80">{pageTitle}</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open admin menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-gray-950 text-white border-white/10"
            >
              <SheetHeader>
                <SheetTitle>Admin Menu</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6 space-y-5">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Gigs
                  </div>
                  <SheetClose asChild>
                    <Button
                      variant={activeSection === "gigs-list" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => onSectionChange("gigs-list")}
                    >
                      Gig Listings
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant={activeSection === "gigs-calendar" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => onSectionChange("gigs-calendar")}
                    >
                      Calendar
                    </Button>
                  </SheetClose>
                </div>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Payments
                  </div>
                  <SheetClose asChild>
                    <Button
                      variant={activeSection === "payments-revenue" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => onSectionChange("payments-revenue")}
                    >
                      Revenue Rundown
                    </Button>
                  </SheetClose>
                </div>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Tools
                  </div>
                  <SheetClose asChild>
                    <Button
                      variant={activeSection === "tools" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => onSectionChange("tools")}
                    >
                      Tools
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden sm:flex items-center gap-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={isGigsSection ? "default" : "outline"}
                size="sm"
                className="gap-2 group"
              >
                Gigs
                <span className="text-xs opacity-70 group-data-[state=open]:rotate-180 transition-transform">
                  ▾
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Gigs</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onSectionChange("gigs-list")}>
                Gig Listings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSectionChange("gigs-calendar")}>
                Calendar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              Payments
            </div>
            <Button
              variant={activeSection === "payments-revenue" ? "default" : "outline"}
              size="sm"
              onClick={() => onSectionChange("payments-revenue")}
            >
              Revenue Rundown
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              Tools
            </div>
            <Button
              variant={activeSection === "tools" ? "default" : "outline"}
              size="sm"
              onClick={() => onSectionChange("tools")}
            >
              Tools
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
