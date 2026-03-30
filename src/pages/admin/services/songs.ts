import type { Song } from "../types";

export async function fetchSongs(): Promise<Song[]> {
  const res = await fetch("/api/songs");
  if (!res.ok) {
    throw new Error(`Failed to fetch songs (${res.status})`);
  }

  const data = await res.json();
  return data.map((song: any) => ({
    ...song,
    _id: song._id?.toString(),
  }));
}

export async function saveSong(formData: Song, currentSong?: Song | null) {
  const method = currentSong?._id ? "PUT" : "POST";
  const payload: Song & { _id?: string } = {
    ...formData,
  };

  if (currentSong?._id) {
    payload._id = currentSong._id;
  }

  const res = await fetch("/api/songs", {
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

export async function deleteSong(songId: string) {
  const res = await fetch(`/api/songs?id=${songId}`, { method: "DELETE" });
  if (![200, 204].includes(res.status)) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error || "Failed to delete song";
    throw new Error(message);
  }
}
