import { Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";

type Props = {
  pageTitle: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};
export default function AdminHeader({
  pageTitle,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-white/45">
          Soundwalk / Backstage
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {pageTitle}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="h-11 shrink-0 rounded-full bg-white px-6 text-[#050816] hover:bg-white/90"
        >
          <Plus size={18} />
          {actionLabel}
        </Button>
      )}
    </header>
  );
}
