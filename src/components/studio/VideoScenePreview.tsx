import type { PromptVideoDesignValues } from '@/types/domain';

export function VideoScenePreview({ scene, values, aspectRatio = '16:9' }: {
  scene: { sceneId: string; title: string; archetype: string; screenshotUrl?: string } | null;
  values: PromptVideoDesignValues; aspectRatio?: string;
}) {
  const fields = scene ? values.scenes[scene.sceneId] || {} : {};
  const colors = values.colors;
  return <div className="relative flex w-full max-w-4xl overflow-hidden rounded-xl" style={{ aspectRatio: aspectRatio.replace(':', '/'), maxHeight: 620, background: colors.BackgroundPrimary || '#252d22', color: colors.TextPrimary || '#faf8ef' }}>
    {!scene ? <p className="m-auto p-10 text-sm opacity-50">Select a scene to preview its composition.</p> : scene.archetype === 'END_CARD_CTA' ? <div className="m-auto p-[8%] text-center"><p className="font-mono text-[8px] uppercase tracking-[.25em] opacity-50">The next chapter</p><h2 className="mt-5 text-[clamp(1.5rem,3vw,3rem)] font-medium leading-tight tracking-tight">{fields.TitleText || scene.title}</h2><p className="mt-4 text-[clamp(.7rem,1.1vw,1rem)] opacity-60">{fields.SubtitleText}</p>{fields.CtaUrl && <span className="mt-7 inline-block rounded-lg px-5 py-3 text-xs" style={{ background: colors.AccentPrimary || '#b95030' }}>Explore more</span>}</div> : <div className={`flex w-full gap-[6%] p-[7%] ${scene.archetype === 'BROWSER_SPOTLIGHT' || aspectRatio === '9:16' ? 'flex-col justify-center' : 'items-center'}`}><div className="min-w-0 flex-1"><span className="mb-4 block h-1 w-9" style={{ background: colors.AccentPrimary || '#b95030' }} /><h2 className="text-[clamp(1.2rem,2.5vw,2.7rem)] font-medium leading-tight tracking-[-.04em]">{fields.TitleText || scene.title}</h2><p className="mt-4 text-[clamp(.65rem,1vw,.95rem)] leading-relaxed opacity-60">{fields.SubtitleText}</p></div>{scene.screenshotUrl && <img src={scene.screenshotUrl} alt="" className={`min-w-0 rounded-lg object-contain shadow-xl ${scene.archetype === 'BROWSER_SPOTLIGHT' || aspectRatio === '9:16' ? 'mt-5 max-h-[60%]' : 'max-w-[50%] flex-1'}`} />}</div>}
  </div>;
}
