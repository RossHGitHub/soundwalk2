import type { SavedSetList } from "../types";

export async function fetchSetLists(): Promise<SavedSetList[]> {
  const res = await fetch("/api/setlists");
  if (!res.ok) {
    throw new Error(`Failed to fetch setlists (${res.status})`);
  }

  const data = await res.json();
  return data.map((setlist: any) => ({
    ...setlist,
    _id: setlist._id?.toString(),
  }));
}

export async function saveSetList(
  formData: SavedSetList,
  currentSetListId?: string | null
) {
  const method = currentSetListId ? "PUT" : "POST";
  const payload = {
    ...formData,
    _id: currentSetListId ?? undefined,
  };

  const res = await fetch("/api/setlists", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (![200, 201].includes(res.status)) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error || "Server error";
    throw new Error(message);
  }

  return res.json();
}

export async function deleteSetList(setListId: string) {
  const res = await fetch(`/api/setlists?id=${setListId}`, { method: "DELETE" });
  if (![200, 204].includes(res.status)) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error || "Failed to delete setlist";
    throw new Error(message);
  }
}
