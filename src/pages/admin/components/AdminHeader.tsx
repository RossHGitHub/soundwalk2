import { Button } from "../../../components/ui/button";

type Props = {
  pageTitle: string;
  description: string;
  showAddGig: boolean;
  onAddGig: () => void;
};

export default function AdminHeader({
  pageTitle,
  description,
  showAddGig,
  onAddGig,
}: Props) {
  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold">{pageTitle}</h2>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      {showAddGig && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button onClick={onAddGig} className="px-8 py-4 text-lg">
            Add Gig
          </Button>
        </div>
      )}
    </div>
  );
}
