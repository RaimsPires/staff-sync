import { http } from './client';

type Presigned =
  | { key: string; url: string; method: 'PUT'; headers: Record<string, string> }
  | { key: string; url: string; method: 'POST'; fields: Record<string, string> };

export type UploadKind = 'selfie' | 'leave-attachment' | 'correction-attachment' | 'proxy-photo' | 'chat-attachment' | 'avatar';

/**
 * Upload a local file through a presigned URL and return the storage key the API expects
 * (`selfie_key`, `photo_key`, `attachment_keys`...). The dev backend has no object store and
 * hands out placeholder URLs; those are skipped so the rest of the flow still works.
 */
export async function uploadFile(kind: UploadKind, uri: string, contentType = 'image/jpeg'): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  const target = await http.post<Presigned>(`/uploads/${kind}`, { raw: true, rawBody: { content_type: contentType, size_bytes: blob.size } });
  if (target.url.includes('/dev-bucket/')) return target.key;
  if (target.method === 'PUT') {
    const res = await fetch(target.url, { method: 'PUT', headers: target.headers, body: blob });
    if (!res.ok) throw new Error(`upload failed (${res.status})`);
  } else {
    const form = new FormData();
    for (const [k, v] of Object.entries(target.fields)) form.append(k, v);
    form.append('file', blob as unknown as Blob);
    const res = await fetch(target.url, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`upload failed (${res.status})`);
  }
  return target.key;
}
