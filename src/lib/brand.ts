/**
 * The logo that ships with the site.
 *
 * `app_logo` is a setting Dany can change from the dashboard, and until she
 * does, every place that shows a logo should show this one rather than a blue
 * square with a letter in it. Passing it as the default to useSetting means a
 * stored value still wins, so uploading a new logo keeps working exactly as
 * before.
 *
 * The file is the brand mark with a transparent background, so it sits on the
 * white header and the dark footer without a panel behind it.
 */
export const DEFAULT_LOGO = '/logo.png';

/**
 * Should a stored logo be used at all?
 *
 * A logo needs transparency: it sits on a dark header and a light footer. JPEG
 * cannot store any, and until today the dashboard's uploader converted every
 * upload to JPEG — so a round mark with a transparent background came back as
 * a round mark welded into a black square, which is what the site has been
 * showing at the top of every page.
 *
 * Those stored values cannot be repaired, only replaced, so the site declines
 * them and falls back to the mark it ships with. Uploading again fixes it for
 * good: the uploader keeps the alpha channel now and stores a PNG, which this
 * accepts.
 */
export function usableLogo(stored?: string | null): string {
  const value = String(stored ?? '').trim();
  if (!value) return DEFAULT_LOGO;
  if (/^data:image\/jpe?g/i.test(value)) return DEFAULT_LOGO;
  return value;
}
