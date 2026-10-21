import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';

const products: Record<string, { label: string; title: string; intro: string; noun: string; steps: Array<[string, string]>; controls: string[] }> = {
  'interactive-demos': {
    label: 'Interactive walkthroughs', title: 'Less explaining.\nMore understanding.',
    intro: 'Give your audience a path through your product. Capture a page, shape the steps, and share a walkthrough worth exploring.',
    noun: 'walkthrough',
    steps: [['Start with the real product', 'Create a project in your workspace and supply the page you want to capture.'], ['Guide the next action', 'Review captured screens, organize steps, and place the annotations that matter.'], ['Make it ready to share', 'Check your content and publishing settings before sending a share link.']],
    controls: ['Step-by-step editing', 'Hotspots and callouts', 'Project publishing controls'],
  },
  videos: {
    label: 'Video studio', title: 'A product story.\nWith a point of view.',
    intro: 'Turn your product direction into a video project. Shape the storyboard, refine your scenes, and review the result in one working space.',
    noun: 'video',
    steps: [['Set a clear direction', 'Describe the product, audience, and story you want to tell in your workspace.'], ['Work scene by scene', 'Review generated material and edit the visual direction and timeline.'], ['Finish deliberately', 'Preview the project and request an export when the configured rendering engine is available.']],
    controls: ['Storyboard and scene editing', 'Timeline controls', 'Export error reporting'],
  },
  visuals: {
    label: 'Visual studio', title: 'One clear idea.\nA different canvas.',
    intro: 'Bring a product message into focus with editable visual projects. Start with your content, then make the layout your own.',
    noun: 'visual project',
    steps: [['Start with substance', 'Supply your own product message and choose the format for the work.'], ['Make space for the idea', 'Edit the text, imagery, colors, and composition in your visual project.'], ['Review, then export', 'Inspect your design before requesting an export from the available engine.']],
    controls: ['Editable compositions', 'Brand-kit direction', 'Project-specific exports'],
  },
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products[slug];
  if (!product) notFound();
  return <><MarketingHeader /><main className="page-wrap">
    <section className="grid items-end gap-10 border-b border-slate-200 pb-12 pt-8 lg:grid-cols-[1.4fr_1fr]">
      <div><p className="eyebrow">01 / {product.label}</p><h1 className="page-title mt-6 whitespace-pre-line">{product.title}</h1></div>
      <div className="lg:pb-2"><p className="page-intro">{product.intro}</p><div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary" href="/workspaces">Open your workspace ↗</Link><Link className="btn-secondary" href="/register">Account access</Link></div></div>
    </section>
    <section className="py-12"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><h2 className="text-3xl font-semibold tracking-tight">From source to {product.noun}.</h2><p className="text-sm text-slate-500">A workflow, not a sample project.</p></div><div className="grid gap-8 md:grid-cols-3">{product.steps.map(([title, body], index) => <article className="border-t border-slate-300 pt-6" key={title}><p className="eyebrow">0{index + 1}</p><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-4 text-sm leading-7 text-slate-500">{body}</p></article>)}</div></section>
    <section className="mb-12 grid gap-8 rounded-2xl bg-slate-950 p-8 text-white sm:p-10 md:grid-cols-2"><div><p className="eyebrow text-orange-300">02 / In your hands</p><h2 className="mt-4 text-3xl font-semibold tracking-tight">Direction stays with you.</h2><p className="mt-4 text-sm leading-7 text-slate-300">Create from your own material. Nothing is prefilled with someone else’s product or account.</p></div><div className="space-y-4">{product.controls.map(control => <p key={control} className="border-b border-white/20 pb-4 text-lg">{control}</p>)}<p className="text-sm leading-6 text-slate-400">Generation, capture, speech, and exports depend on configured services. The workspace reports unavailable providers instead of simulating results.</p></div></section>
  </main><MarketingFooter /></>;
}
