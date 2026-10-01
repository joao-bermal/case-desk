import { API_URL } from '@/lib/api/client';
import { getSessionToken } from '@/lib/session';

/** Streams the API's CSV export to the browser, signed with the user's session. */
export async function GET(request: Request) {
  const token = await getSessionToken();
  if (!token) return new Response('Unauthorized', { status: 401 });

  const query = new URL(request.url).searchParams;
  const upstream = await fetch(`${API_URL}/cases/export.csv?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!upstream.ok) return new Response('Não foi possível exportar.', { status: upstream.status });

  const today = new Date().toISOString().slice(0, 10);
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="processos-${today}.csv"`,
    },
  });
}
