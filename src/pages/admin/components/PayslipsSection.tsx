import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import type { Gig } from "../types";
import { formatDate } from "../gigs";
import { Button } from "../../../components/ui/button";
import logoUrl from "../../../assets/img/logo.jpg";

type Props = {
  gigs: Gig[];
};

type Person = "Ross" | "Keith" | "Barry";

type MonthGroup = {
  key: string;
  label: string;
};

export default function PayslipsSection({ gigs }: Props) {
  const [selectedPerson, setSelectedPerson] = useState<Person>("Ross");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [collapsedYears, setCollapsedYears] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedGigIds, setSelectedGigIds] = useState<Set<string>>(
    () => new Set()
  );

  const monthsByYear = useMemo(() => {
    const map = new Map<string, Map<string, MonthGroup>>();
    gigs.forEach((gig) => {
      if (!gig.date) return;
      const date = new Date(gig.date);
      if (Number.isNaN(date.getTime())) return;
      const year = String(date.getFullYear());
      const month = date.toLocaleString("default", { month: "long" });
      const key = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(year)) map.set(year, new Map());
      map.get(year)!.set(key, { key, label: month });
    });
    const sortedYears = Array.from(map.keys()).sort((a, b) => Number(a) - Number(b));
    return sortedYears.map((year) => ({
      year,
      months: Array.from(map.get(year)!.values()).sort((a, b) =>
        a.key.localeCompare(b.key)
      ),
    }));
  }, [gigs]);

  useEffect(() => {
    if (selectedMonth || monthsByYear.length === 0) return;
    const today = new Date();
    const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const availableKeys = monthsByYear.flatMap((entry) =>
      entry.months.map((month) => month.key)
    );
    setSelectedMonth(
      availableKeys.includes(currentKey) ? currentKey : availableKeys[0] ?? ""
    );
  }, [monthsByYear, selectedMonth]);

  useEffect(() => {
    if (selectedYear || monthsByYear.length === 0) return;
    const availableYears = monthsByYear.map((entry) => entry.year);
    const currentYear = String(new Date().getFullYear());
    setSelectedYear(
      availableYears.includes(currentYear)
        ? currentYear
        : availableYears[availableYears.length - 1] ?? ""
    );
  }, [monthsByYear, selectedYear]);

  const selectedGigs = useMemo(() => {
    if (!selectedMonth) return [];
    return gigs
      .filter((gig) => {
        if (!gig.date) return false;
        const date = new Date(gig.date);
        if (Number.isNaN(date.getTime())) return false;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return selectedMonth === key;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [gigs, selectedMonth]);

  function getPersonPayValue(gig: Gig) {
    return (
      selectedPerson === "Ross"
        ? Number(gig.paymentSplitRoss) || 0
        : selectedPerson === "Keith"
          ? Number(gig.paymentSplitKeith) || 0
          : Number(gig.paymentSplitBarry) || 0
    );
  }

  function getPersonPay(gig: Gig) {
    return getPersonPayValue(gig).toFixed(2);
  }

  function getGigKey(gig: Gig) {
    return gig._id ?? `${gig.venue}-${gig.date}`;
  }

  function toggleMonth(key: string) {
    setSelectedMonth(key);
  }

  function toggleYear(year: string) {
    setCollapsedYears((prev) => {
      const isOpen = !prev[year];
      if (!isOpen) {
        return { ...prev, [year]: false };
      }
      return { [year]: true };
    });
  }

  function toggleGigSelection(key: string) {
    setSelectedGigIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selectAllGigs() {
    setSelectedGigIds(new Set(selectedGigs.map((gig) => getGigKey(gig))));
  }

  function selectCashGigs() {
    setSelectedGigIds(
      new Set(
        selectedGigs
          .filter((gig) => gig.paymentMethod === "Cash")
          .map((gig) => getGigKey(gig))
      )
    );
  }

  function clearSelectedGigs() {
    setSelectedGigIds(new Set());
  }

  const selectedGigDetails = useMemo(() => {
    const selectedKeys = selectedGigIds;
    return selectedGigs.filter((gig) => selectedKeys.has(getGigKey(gig)));
  }, [selectedGigs, selectedGigIds]);

  const yearlyMonthTotals = useMemo(() => {
    if (!selectedYear) return [];
    const totals = Array.from({ length: 12 }, (_, index) => ({
      monthIndex: index,
      label: new Date(2000, index, 1).toLocaleString("default", {
        month: "long",
      }),
      total: 0,
    }));
    gigs.forEach((gig) => {
      if (!gig.date) return;
      const date = new Date(gig.date);
      if (Number.isNaN(date.getTime())) return;
      if (String(date.getFullYear()) !== selectedYear) return;
      const monthIndex = date.getMonth();
      totals[monthIndex].total += getPersonPayValue(gig);
    });
    return totals;
  }, [gigs, selectedYear, selectedPerson]);

  async function loadImageData(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(blob);
    });
  }

  async function handleGeneratePayslip() {
    if (selectedGigDetails.length === 0) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;

    const logoData = await loadImageData(logoUrl);
    const logoWidth = 140;
    const logoHeight = 32;
    doc.addImage(
      logoData,
      "JPEG",
      pageWidth - margin - logoWidth,
      margin - 6,
      logoWidth,
      logoHeight
    );

    doc.setDrawColor(220);
    doc.line(margin, margin + 54, pageWidth - margin, margin + 54);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Payslip", margin, margin + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const selectedMonthLabel = selectedMonth
      ? new Date(`${selectedMonth}-01`).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })
      : "";
    doc.setTextColor(60);
    doc.text(`${selectedMonthLabel} • ${selectedPerson}`, margin, margin + 32);
    doc.setTextColor(20);

    const tableTop = margin + 90;
    doc.setDrawColor(210);
    doc.setFillColor(242, 242, 242);
    doc.rect(margin, tableTop, pageWidth - margin * 2, 26, "F");
    doc.setTextColor(30);
    doc.setFont("helvetica", "bold");
    doc.text("Date", margin + 10, tableTop + 18);
    doc.text("Venue", margin + 180, tableTop + 18);
    doc.text("Payment", pageWidth - margin - 10, tableTop + 18, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(20);
    let y = tableTop + 44;
    const rowHeight = 24;
    let total = 0;

    selectedGigDetails.forEach((gig, index) => {
      const pay = Number(getPersonPay(gig));
      total += pay;
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 16, pageWidth - margin * 2, rowHeight, "F");
        doc.setTextColor(20);
      }
      doc.text(formatDate(gig.date), margin + 10, y);
      doc.text(gig.venue || "-", margin + 180, y);
      doc.text(`£${pay.toFixed(2)}`, pageWidth - margin - 10, y, {
        align: "right",
      });
      y += rowHeight;
      if (y > pageHeight - margin - 60) {
        doc.addPage();
        y = margin + 20;
      }
    });

    const footerY = Math.min(pageHeight - margin, y + 16);
    doc.setDrawColor(210);
    doc.line(margin, footerY - 16, pageWidth - margin, footerY - 16);
    doc.setFont("helvetica", "bold");
    doc.text("Total", pageWidth - margin - 120, footerY);
    doc.text(`£${total.toFixed(2)}`, pageWidth - margin - 10, footerY, {
      align: "right",
    });

    const monthToken = selectedMonth
      ? new Date(`${selectedMonth}-01`).toLocaleString("default", {
          month: "short",
        })
      : "Month";
    const yearToken = selectedMonth ? selectedMonth.slice(2, 4) : "YY";
    const filename = `${monthToken}${yearToken}${selectedPerson}SWPayslip.pdf`;
    doc.save(filename);
  }

  async function handleGenerateYearlyPayslip() {
    if (!selectedYear) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;

    const logoData = await loadImageData(logoUrl);
    const logoWidth = 140;
    const logoHeight = 32;
    doc.addImage(
      logoData,
      "JPEG",
      pageWidth - margin - logoWidth,
      margin - 6,
      logoWidth,
      logoHeight
    );

    doc.setDrawColor(220);
    doc.line(margin, margin + 54, pageWidth - margin, margin + 54);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Payslip", margin, margin + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text(`${selectedYear} • ${selectedPerson}`, margin, margin + 32);
    doc.setTextColor(20);

    const tableTop = margin + 90;
    doc.setDrawColor(210);
    doc.setFillColor(242, 242, 242);
    doc.rect(margin, tableTop, pageWidth - margin * 2, 26, "F");
    doc.setTextColor(30);
    doc.setFont("helvetica", "bold");
    const yearlyTableWidth = 360;
    const yearlyTableLeft = (pageWidth - yearlyTableWidth) / 2;
    const totalColumnX = yearlyTableLeft + yearlyTableWidth - 10;
    doc.text("Month", yearlyTableLeft + 10, tableTop + 18);
    doc.text("Total", totalColumnX, tableTop + 18, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(20);
    let y = tableTop + 44;
    const rowHeight = 24;
    let total = 0;

    yearlyMonthTotals.forEach((month, index) => {
      total += month.total;
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 16, pageWidth - margin * 2, rowHeight, "F");
        doc.setTextColor(20);
      }
      doc.text(month.label, yearlyTableLeft + 10, y);
      doc.text(`£${month.total.toFixed(2)}`, totalColumnX, y, {
        align: "right",
      });
      y += rowHeight;
      if (y > pageHeight - margin - 60) {
        doc.addPage();
        y = margin + 20;
      }
    });

    const footerY = Math.min(pageHeight - margin, y + 16);
    doc.setDrawColor(210);
    doc.line(margin, footerY - 16, pageWidth - margin, footerY - 16);
    doc.setFont("helvetica", "bold");
    doc.text("Total", pageWidth - margin - 120, footerY);
    doc.text(`£${total.toFixed(2)}`, pageWidth - margin - 10, footerY, {
      align: "right",
    });

    const filename = `${selectedYear}${selectedPerson}SWPayslip.pdf`;
    doc.save(filename);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        {(["Ross", "Keith", "Barry"] as Person[]).map((person) => (
          <Button
            key={person}
            variant={selectedPerson === person ? "default" : "outline"}
            onClick={() => setSelectedPerson(person)}
          >
            {person}
          </Button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="lg:flex-none lg:w-[220px] shrink-0">
          <div className="w-[220px] rounded-2xl border border-white/10 bg-gray-950/70 p-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {monthsByYear.length === 0 && (
                <div className="text-sm text-white/60">No gigs found.</div>
              )}
              {monthsByYear.map((entry) => (
                <div key={entry.year} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleYear(entry.year)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs uppercase tracking-[0.2em] text-white/50 hover:bg-white/10"
                  >
                    <span>{entry.year}</span>
                    <span className="text-white/40">
                      {collapsedYears[entry.year] ? "+" : "–"}
                    </span>
                  </button>
                  {!collapsedYears[entry.year] && (
                    <div className="space-y-1 pl-1">
                      {entry.months.map((month) => {
                        const isActive = selectedMonth === month.key;
                        return (
                          <button
                            key={month.key}
                            type="button"
                            onClick={() => toggleMonth(month.key)}
                            className={`w-full rounded-md px-2 py-1 text-left text-sm transition ${
                              isActive
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "text-white/70 hover:bg-white/10"
                            }`}
                          >
                            {month.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="rounded-2xl border border-white/10 bg-gray-950/70 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Payslip Builder
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={selectAllGigs}>
                  Add All Gigs
                </Button>
                <Button size="sm" variant="outline" onClick={selectCashGigs}>
                  Add Cash Gigs
                </Button>
                <Button size="sm" variant="destructive" onClick={clearSelectedGigs}>
                  Remove All Gigs
                </Button>
                <Button
                  size="sm"
                  onClick={handleGeneratePayslip}
                  disabled={selectedGigDetails.length === 0}
                >
                  Generate Payslip
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {selectedGigs.length === 0 && (
                <div className="text-sm text-white/60">
                  Select a month to see gigs.
                </div>
              )}
              {selectedGigs.map((gig) => (
                (() => {
                  const key = getGigKey(gig);
                  const isChecked = selectedGigIds.has(key);
                  return (
                <label
                  key={key}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-500"
                    checked={isChecked}
                    onChange={() => toggleGigSelection(key)}
                  />
                  <div className="flex flex-1 flex-wrap items-center gap-4">
                    <div className="min-w-[160px] font-semibold">{gig.venue}</div>
                    <div className="text-white/60">{formatDate(gig.date)}</div>
                    <div className="text-emerald-300 font-semibold">
                      £{getPersonPay(gig)}
                    </div>
                    <div className="text-white/60">
                      {gig.paymentMethod ? gig.paymentMethod : "No payment method"}
                    </div>
                  </div>
                </label>
                  );
                })()
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Yearly Payslip Generator
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <select
                  className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/80"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                >
                  {monthsByYear.length === 0 && (
                    <option value="">No years available</option>
                  )}
                  {monthsByYear.map((entry) => (
                    <option key={entry.year} value={entry.year}>
                      {entry.year}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleGenerateYearlyPayslip}
                  disabled={!selectedYear}
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
