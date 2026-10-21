export type SupportedUiLang = 'en' | 'zh-CN' | 'ja' | 'ko';
export const UI_LANGUAGES: { code: SupportedUiLang; shortLabel: string; nativeName: string }[] = [
  { code: 'en', shortLabel: 'EN', nativeName: 'English' },
  { code: 'zh-CN', shortLabel: '中文', nativeName: '简体中文' },
  { code: 'ja', shortLabel: '日本語', nativeName: '日本語' },
  { code: 'ko', shortLabel: '한국어', nativeName: '한국어' },
];
type Labels = { home: string; library: string; brandKits: string; teamInsights: string; leads: string; inbox: string; memory: string; archive: string; trash: string; settings: string; create: string };
export const UI_DICTIONARY: Record<SupportedUiLang, Labels> = {
  en: { home: 'Overview', library: 'Your work', brandKits: 'Brand kits', teamInsights: 'Insights', leads: 'Leads', inbox: 'Inbox', memory: 'Brand knowledge', archive: 'Archive', trash: 'Trash', settings: 'Settings', create: 'Create' },
  'zh-CN': { home: '工作台', library: '作品库', brandKits: '品牌套件', teamInsights: '数据洞察', leads: '潜在客户', inbox: '收件箱', memory: '品牌知识', archive: '已归档', trash: '回收站', settings: '设置', create: '创作' },
  ja: { home: '概要', library: 'ライブラリ', brandKits: 'ブランドキット', teamInsights: 'インサイト', leads: 'リード', inbox: '受信トレイ', memory: 'ブランド知識', archive: 'アーカイブ', trash: 'ゴミ箱', settings: '設定', create: '作成' },
  ko: { home: '개요', library: '라이브러리', brandKits: '브랜드 키트', teamInsights: '인사이트', leads: '리드', inbox: '수신함', memory: '브랜드 지식', archive: '보관함', trash: '휴지통', settings: '설정', create: '만들기' },
};
export function getSavedUiLang(): SupportedUiLang {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem('arcade_ui_lang');
  return UI_LANGUAGES.find((lang) => lang.code === saved)?.code || 'en';
}
export function setSavedUiLang(lang: SupportedUiLang) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('arcade_ui_lang', lang);
  window.dispatchEvent(new CustomEvent('arcade-lang-change', { detail: lang }));
}
