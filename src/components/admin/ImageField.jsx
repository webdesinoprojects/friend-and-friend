import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import api from "../../api/api";

export default function ImageField({ value, onChange, label = "Image", onMessage, hideUrl = false }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const { data } = await api.post("/admin/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data?.image?.url || data?.image?.thumbnailUrl || "");
      onMessage?.(`${label} updated. Click save to keep changes.`);
    } catch (error) {
      onMessage?.(error.response?.data?.message || "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-black/45">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#f7f7f5] px-3 py-2">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/5">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        {hideUrl ? (
          <span className="flex-1 truncate text-sm font-bold text-black/60">
            {value ? "Image uploaded" : "No image uploaded"}
          </span>
        ) : (
          <input
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste image URL or upload from gallery"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-xs font-black text-black transition hover:bg-black/5"
        >
          <Upload size={15} /> {uploading ? "Uploading..." : "Upload from Gallery"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-xs font-black text-black transition hover:bg-black/5"
          >
            <X size={15} /> Remove
          </button>
        ) : null}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
