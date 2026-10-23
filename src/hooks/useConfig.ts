import { useQuery } from '@tanstack/react-query';
import { afterPageLoad } from '../lib/timing';
import { getDocument } from '../lib/firestoreRest';

const DEFAULT_PHONE = '(218) 357-5938';
// A placeholder the very first version of the site shipped with.
const PLACEHOLDER_PHONE = '(203) 456-7890';

type Config = { businessPhone: string } & Record<string, any>;

/**
 * The business phone shown across the site (header, hero, contact block,
 * footer, form, chat), from settings/general when it is set there.
 *
 * Read once per visit and shared by every component that shows it — each one
 * used to fetch it for itself, six requests for the same document. The
 * default is on screen from the first paint; the stored value, if any, is
 * fetched once the page has loaded.
 */
export function useConfig(): Config {
  const { data } = useQuery<Config>({
    queryKey: ['public-config'],
    staleTime: Infinity,
    queryFn: async () => {
      const host = window.location.hostname;
      const isProd = host === 'danycleanpro.com' || host === 'www.danycleanpro.com' || host.includes('netlify.app');

      // The local development server answers /api/config; the live site has
      // no such route, so it is not asked there.
      if (!isProd) {
        try {
          const res = await fetch('/api/config');
          if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
            const local = await res.json();
            if (local?.businessPhone) {
              return { ...local, businessPhone: local.businessPhone === PLACEHOLDER_PHONE ? DEFAULT_PHONE : local.businessPhone };
            }
          }
        } catch {
          // no local server — fall through
        }
      }

      await afterPageLoad();
      const stored = (await getDocument('settings/general'))?.data;
      if (stored?.businessPhone) {
        return { ...stored, businessPhone: stored.businessPhone === PLACEHOLDER_PHONE ? DEFAULT_PHONE : stored.businessPhone };
      }
      return { businessPhone: DEFAULT_PHONE };
    },
  });
  return data ?? { businessPhone: DEFAULT_PHONE };
}
