import { PublishedFlow } from '@/components/studio/PublishedFlow';
export default async function FlowGuide({ params }: { params: Promise<{ id: string }> }) {
  return <PublishedFlow id={(await params).id} guide />;
}
