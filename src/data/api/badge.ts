import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import type { BadgeCatalog, BadgeCollection, BadgeMaster, Season } from '@/data/types/badge';

async function request<T>(path: string, body?: unknown): Promise<T> {
  const url = `${getBaseUrl('DATA')}/badge/${path}`;
  const response = body === undefined ? await api.get(url) : await api.post(url, body);
  if (response.status >= 400 || response.data?.datas === undefined) {
    throw new Error(response.data?.message || '휘장 정보를 처리하지 못했습니다.');
  }
  return response.data.datas;
}
export const badgeApi = {
  catalog: () => request<BadgeCatalog>('catalog'),
  collection: (id: number) => request<BadgeCollection>(`collection?account_id=${id}`),
  saveMaster: (body: Pick<BadgeMaster, 'name' | 'description' | 'is_active'> & { id?: number }, file?: File | null) => {
    const form = new FormData();
    if (body.id != null) form.append('id', String(body.id));
    form.append('name', body.name);
    form.append('description', body.description);
    form.append('is_active', String(body.is_active));
    if (file) form.append('image', file);
    return request<BadgeMaster>('master/save', form);
  },
  saveSeason: (body: Omit<Season, 'id'> & { id?: number }) => request<Season>('season/save', body),
  grant: (body: { account_id: number; badge_id: number; season_id: number; grant_key?: string; reason: string }) => request('grant', body),
  revoke: (id: number, reason: string) => request('revoke', { id, reason }),
  equip: (id: number | null) => request('equip', { account_badge_id: id }),

};
export function badgeImageUrl(value?: string | null): string {
  if (!value) return '';
  if (value.startsWith('blob:')) return value;
  if (/^\/badge\/master\/\d+\/image(?:\?v=[a-f0-9]+)?$/.test(value)) return `${getBaseUrl('DATA').replace(/\/$/, '')}${value}`;
  if (/^https:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/badges/')) return `${getBaseUrl('DATA').replace(/\/$/, '')}${value}`;
  if (value.startsWith('/images/badges/')) return value;
  return '';
}
export function badgeError(error: unknown): string {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message || e.message || '요청을 처리하지 못했습니다.';
}
