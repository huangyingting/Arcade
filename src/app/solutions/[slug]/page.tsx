import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';

const solutions: Record<string, { label: string; title: string; intro: string; items: Array<[string, string]> }> = {
  marketing: { label: 'Product marketing', title: 'Give the launch\nsomething to show.', intro: 'Build a product narrative people can explore. Keep the walkthrough, video, and visual direction together without replacing your team’s judgment.', items: [['Show the actual workflow', 'Use a focused walkthrough to introduce the problem your product solves.'], ['Shape the launch story', 'Turn your message into an editable video project and supporting visuals.'], ['Learn from real activity', 'Review recorded viewer events and submitted lead forms after sharing.']] },
  sales: { label: 'Sales & solutions', title: 'Let the product\njoin the conversation.', intro: 'Create a focused demonstration for the conversations that matter. Give prospects something concrete to review at their own pace.', items: [['Make the path clear', 'Organize the product steps around the questions your audience is asking.'], ['Share with context', 'Publish reviewed work and use collections to keep related stories together.'], ['Keep the evidence honest', 'See recorded engagement and captured leads. CRM sync and revenue attribution are not currently available.']] },
  enablement: { label: 'Customer enablement', title: 'Make the next step\nfeel obvious.', intro: 'Turn product knowledge into something people can follow. Keep guidance close to the real interface, one deliberate step at a time.', items: [['Focus on one task', 'Build a walkthrough around the workflow your audience needs to complete.'], ['Give the details room', 'Refine annotations and sequencing before you publish a guide.'], ['Keep a shared reference', 'Save genuine product facts and language preferences in your workspace.']] },
};
export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = solutions[slug];
  if (!solution) notFound();
  return <><MarketingHeader /><main className="page-wrap">
    <section className="grid gap-10 border-b border-slate-200 pb-12 pt-8 lg:grid-cols-[1.4fr_1fr]">
      <div><p className="eyebrow">01 / {solution.label}</p><h1 className="page-title mt-6 whitespace-pre-line">{solution.title}</h1></div>
      <div className="self-end"><p className="page-intro">{solution.intro}</p><Link href="/workspaces" className="btn-primary mt-8">Open your workspace ↗</Link></div>
    </section>
    <section className="grid gap-8 py-12 md:grid-cols-3">{solution.items.map(([title, body], index) => <article key={title} className="border-t border-slate-300 pt-6"><p className="eyebrow">0{index + 1} / In practice</p><h2 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-4 text-sm leading-7 text-slate-500">{body}</p></article>)}</section>
    <aside className="mb-12 flex flex-wrap items-center justify-between gap-8 rounded-2xl bg-slate-950 p-8 text-white">
      <div><p className="eyebrow text-orange-300">02 / Start with your product</p><h2 className="mt-3 text-3xl font-semibold">A real project. A clear purpose.</h2><p className="mt-4 text-sm text-slate-300">Start with your own material. Review your work before you share it.</p></div>
      <Link href="/product/interactive-demos" className="btn-secondary bg-white">Explore the workflow →</Link>
    </aside>
  </main><MarketingFooter /></>;
}
