"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  currentUrl?: string | null;
  initials: string;
};

function resizeToDataUrl(file: File, size = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      // Crop carré centré
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function AvatarUpload({ currentUrl, initials }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setLoading(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 200);
      setPreview(dataUrl);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    setLoading(true);
    setPreview(null);
    await fetch("/api/user/avatar", { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="relative mx-auto w-fit">
      {/* Avatar */}
      <div className="relative grid h-20 w-20 place-items-center rounded-[1.5rem] bg-emerald-500 text-2xl font-black text-ink shadow-glow overflow-hidden">
        {preview ? (
          <img src={preview} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Bouton caméra */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-ink shadow-md ring-2 ring-[var(--bg)] transition hover:bg-emerald-400 disabled:opacity-50"
        title="Changer la photo"
      >
        <Camera size={13} />
      </button>

      {/* Bouton supprimer si avatar présent */}
      {preview && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="absolute -bottom-1 -left-1 grid h-7 w-7 place-items-center rounded-full bg-rose-500/80 text-white shadow-md ring-2 ring-[var(--bg)] transition hover:bg-rose-500 disabled:opacity-50"
          title="Supprimer la photo"
        >
          <Trash2 size={11} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
