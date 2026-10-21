import Link from 'next/link';

export default function RegisterPage() {
  return <main className="auth-layout">
    <section className="auth-story [&_.page-title]:text-white [&_.page-intro]:text-slate-300 [&_.eyebrow]:text-orange-300">
      <Link href="/" className="text-2xl font-bold">Arcade.</Link>
      <div className="py-16"><p className="eyebrow">01 / Account access</p><h1 className="page-title mt-5">Good work starts<br />with an invitation.</h1><p className="page-intro mt-6">A considered space for the people building your product story.</p></div>
    </section>
    <section className="auth-card"><p className="eyebrow">Invitation-only</p><h2 className="mt-3 text-3xl font-semibold">Join your team</h2><p className="mt-5 text-slate-600">To create an account, open the one-time invitation link supplied by your platform administrator. There is no public registration or self-service administrator setup.</p><p className="mt-4 text-sm text-slate-500">If your invitation has expired or was already used, ask the sender for a new link.</p><Link href="/auth" className="btn-primary mt-8">Already have an account? Sign in →</Link><Link href="/" className="btn-quiet mt-3">Back to Arcade</Link></section>
  </main>;
}
