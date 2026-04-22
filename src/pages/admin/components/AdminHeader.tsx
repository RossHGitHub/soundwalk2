import { Button } from "../../../components/ui/button";

type Props = {
  pageTitle: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export default function AdminHeader({
  pageTitle,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: Props) {
  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold">{pageTitle}</h2>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      {((actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction)) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button onClick={onAction} className="px-8 py-4 text-lg">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
