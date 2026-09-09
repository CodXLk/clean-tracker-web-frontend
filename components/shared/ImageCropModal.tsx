"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/shared/PillButton";

const VIEWPORT = 260; // on-screen crop circle diameter (px)
const OUTPUT = 512; // exported square image size (px)
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface Point {
  x: number;
  y: number;
}

interface ImageCropModalProps {
  open: boolean;
  file: File | null;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  busy?: boolean;
}

/**
 * Circular avatar cropper. Lets the user zoom and drag to frame a photo inside a
 * circle, then exports a centred square JPEG that fits the avatar's round shape.
 */
export function ImageCropModal({ open, file, onCancel, onConfirm, busy = false }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const [loaded, setLoaded] = useState<{ file: File; img: HTMLImageElement } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  // Only treat the image as ready once it matches the file currently being cropped,
  // so switching files never flashes the previous photo.
  const img = loaded && loaded.file === file ? loaded.img : null;

  // Scale that makes the image cover the circle at zoom = 1, so there are never gaps.
  const baseScale = img ? Math.max(VIEWPORT / img.naturalWidth, VIEWPORT / img.naturalHeight) : 1;
  const scale = baseScale * zoom;

  // Keep the image covering the viewport — the user can't drag past its edges.
  const clamp = useCallback(
    (next: Point, s: number): Point => {
      if (!img) return { x: 0, y: 0 };
      const maxX = Math.max(0, (img.naturalWidth * s - VIEWPORT) / 2);
      const maxY = Math.max(0, (img.naturalHeight * s - VIEWPORT) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [img],
  );

  // Load the selected file into an image and reset the framing.
  useEffect(() => {
    if (!open || !file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setLoaded({ file, img: image });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [open, file]);

  // Redraw the preview whenever the framing changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, VIEWPORT, VIEWPORT);
    if (!img) return;
    const dispW = img.naturalWidth * scale;
    const dispH = img.naturalHeight * scale;
    const left = VIEWPORT / 2 + offset.x - dispW / 2;
    const top = VIEWPORT / 2 + offset.y - dispH / 2;
    ctx.drawImage(img, left, top, dispW, dispH);
  }, [img, scale, offset]);

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setOffset(clamp({ x: drag.ox + dx, y: drag.oy + dy }, scale));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }

  function handleZoom(nextZoom: number) {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    setZoom(z);
    setOffset((o) => clamp(o, baseScale * z));
  }

  function handleConfirm() {
    if (!img || !file) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = OUTPUT / VIEWPORT;
    const dispW = img.naturalWidth * scale;
    const dispH = img.naturalHeight * scale;
    const left = (VIEWPORT / 2 + offset.x - dispW / 2) * ratio;
    const top = (VIEWPORT / 2 + offset.y - dispH / 2) * ratio;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.drawImage(img, left, top, dispW * ratio, dispH * ratio);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const baseName = file.name.replace(/\.[^.]+$/, "") || "avatar";
        onConfirm(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60" onClick={busy ? undefined : onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Adjust photo"
        className={cn(
          "fixed z-[61] bg-white",
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[90vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-sm lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-lg font-bold text-on-surface">Adjust photo</h2>
          <button
            onClick={onCancel}
            disabled={busy}
            aria-label="Cancel"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <p className="px-6 pt-1 text-sm text-grey-500">Drag to reposition and use the slider to zoom.</p>

        <div className="flex justify-center px-6 pt-5">
          <div
            className="relative overflow-hidden rounded-full ring-2 ring-primary/40"
            style={{ width: VIEWPORT, height: VIEWPORT }}
          >
            <canvas
              ref={canvasRef}
              width={VIEWPORT}
              height={VIEWPORT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="h-full w-full touch-none select-none cursor-grab active:cursor-grabbing"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-8 pt-5">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => handleZoom(zoom - 0.2)}
            className="rounded-full p-1 text-grey-600 hover:bg-grey-100"
          >
            <Minus size={18} strokeWidth={2} />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-grey-200 accent-primary"
          />
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => handleZoom(zoom + 0.2)}
            className="rounded-full p-1 text-grey-600 hover:bg-grey-100"
          >
            <Plus size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex gap-3 px-6 pb-8 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex h-14 w-full items-center justify-center rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <PillButton variant="orange" onClick={handleConfirm} disabled={busy || !img}>
            {busy ? "Saving…" : "Save photo"}
          </PillButton>
        </div>
      </div>
    </>
  );
}
