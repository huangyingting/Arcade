export type AccountUser = { id: string; name: string; email: string; image: string | null; role: string };
export type AssetSummary = {
  id: string; name: string; status: string; shareId?: string; thumbnailUrl: string | null; updatedAt: string;
  viewsCount?: number; completionsCount?: number;
};
export type WorkspaceData = {
  id: string; slug: string; name: string; role: string; planTier: string;
  monthlyCreditsQuota: number; bonusCreditsBalance: number; usedCreditsThisCycle: number;
  flows: AssetSummary[]; promptVideos: AssetSummary[]; visualProjects: AssetSummary[]; collections: AssetSummary[];
  brandKits: { id: string; name: string; sourceUrl: string; isDefault: boolean }[];
  teams: { id: string; name: string; slug: string }[];
  notifications: { id: string; isRead: boolean }[];
};
export type Capabilities = { ai: boolean; speech: boolean; email: boolean; billing: boolean; integrations: boolean };
