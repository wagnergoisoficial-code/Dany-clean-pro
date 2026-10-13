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
