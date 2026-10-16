import type { RecordVisual } from "@/lib/types";
import { FigureCaption, FigureTitle } from "./parts";

type Images = Extract<RecordVisual, { kind: "images" }>;
type Item = Images["images"][number];

function Frame({ item }: { item: Item }) {
  const { src, alt, caption, mark, width, height } = item;
  return (
    <figure className="min-w-0">
      {/* The box is reserved from the image's own size, so the ring is placed right from first paint. */}
      <div className="relative" style={{ aspectRatio: `${width} / ${height}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local demo images, shown at their own aspect ratio */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="block h-full w-full rounded-xl border border-line bg-sunken object-contain"
        />
        {mark ? (
          <span
            className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sage outline outline-1 outline-paper/60"
            style={{ left: `${mark.x * 100}%`, top: `${mark.y * 100}%`, width: `${mark.r * 200}%` }}
          >
            <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-paper px-2.5 py-0.5 text-[12px] font-medium leading-snug text-ink">
              {mark.label}
            </span>
          </span>
        ) : null}
      </div>
      <figcaption className="mt-2 text-caption text-ink-muted text-pretty">{caption}</figcaption>
    </figure>
  );
}

/** Study images on a quiet panel, with an optional sage ring on the area of interest. */
export function ImagesFigure({ visual }: { visual: Images }) {
  const { title, note, images } = visual;
  return (
    <figure>
      <FigureTitle>{title}</FigureTitle>
      <div className="grid grid-cols-2 items-start gap-3 rounded-card border border-line bg-surface p-3 sm:gap-4 sm:p-4">
        {images.map((item) => (
          <Frame key={item.src} item={item} />
        ))}
      </div>
      <FigureCaption>{note}</FigureCaption>
    </figure>
  );
}
