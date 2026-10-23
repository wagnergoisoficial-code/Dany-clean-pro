import { useQuery } from '@tanstack/react-query';
import { afterPageLoad } from '../lib/timing';
import { getDocument } from '../lib/firestoreRest';

/**
 * A dashboard setting (settings/{id}.value) for the public pages, read once
 * the page has loaded, over plain REST.
 *
 * The dashboard's own useSetting (lib/settings) listens in real time through
 * the Firebase SDK; a visitor needs neither the SDK nor live updates, and the
 * header and footer asking for the same setting share one request.
 */
export function usePublicSetting(id: string): string | null {
  const { data } = useQuery({
    queryKey: ['public-setting', id],
    staleTime: Infinity,
    queryFn: async () => {
      await afterPageLoad();
      const value = (await getDocument(`settings/${id}`))?.data?.value;
      return typeof value === 'string' && value.trim() ? value : null;
    },
  });
  return data ?? null;
}
