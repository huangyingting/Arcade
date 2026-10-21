import type { VisualCanvasItem } from '@/types/domain';

export function VisualPreview({ visual }: { visual: VisualCanvasItem | null }) {
  if (!visual) return <div className="empty-state w-full !border-slate-700 !text-slate-400">Choose a canvas format to begin composing.</div>;
  return <div className="relative flex w-full max-w-3xl flex-col justify-center overflow-hidden p-[7%] shadow-2xl" style={{ aspectRatio: `${visual.width}/${visual.height}`, maxHeight: 700, color: visual.headlineColor, background: visual.backgroundColor }}>
    <div className="relative z-10"><span className="mb-5 block h-1 w-12" style={{ background: visual.ctaBgColor }} /><h2 className="max-w-xl text-[clamp(1.2rem,3.4vw,3.6rem)] font-medium leading-[1.1] tracking-[-.045em]">{visual.headline}</h2>{visual.subheadline && <p className="mt-4 max-w-lg text-[clamp(.6rem,1.1vw,1rem)] leading-relaxed opacity-65">{visual.subheadline}</p>}{visual.ctaLabel && <span className="mt-6 inline-block rounded-md px-4 py-2 text-[clamp(.6rem,1vw,.85rem)] font-medium" style={{ background: visual.ctaBgColor, color: visual.ctaTextColor }}>{visual.ctaLabel}</span>}</div>
    {visual.screenshotUrl && <img className="relative z-0 mt-6 max-h-[50%] min-h-0 rounded-lg object-contain shadow-xl" src={visual.screenshotUrl} alt="" />}
  </div>;
}
