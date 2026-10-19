import LogoUpload from '../../components/ui/LogoUpload';
import HeroCoverUploader from '../../components/hero/HeroCoverUploader';
import AboutImageUploader from '../../components/admin/AboutImageUploader';
import { PageHeader, Panel } from '../../components/admin/ui/Panel';

/**
 * The images the public site is made of.
 *
 * What this page dropped, and why: a pulsing green dot reporting which image
 * was touched last, in two languages, with its value in square brackets. It
 * was debug output wearing a badge — nobody managing a cleaning business needs
 * to know whether HERO or ABOUT changed most recently. And a greyed-out
 * "Business Configuration — coming soon" panel, which is an advertisement for
 * work that has not happened, taking up the space of work that has.
 *
 * Each section is a row: what it controls on the left, the control itself on
 * the right. That shape is why the page can grow — a new setting is a new row,
 * not a new arrangement.
 */
function SettingRow({
  title, hint, children, last,
}: { title: string; hint: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={last ? '' : 'pb-7 mb-7 border-b border-slate-900/[0.06]'}>
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4 lg:gap-8">
        <div>
          <h3 className="font-sans text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{hint}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export default function SettingsManager() {
  return (
    <div className="animate-in fade-in duration-300 max-w-5xl">
      <PageHeader
        title="Settings"
        hint="The pictures your customers see. Changes save on their own and go live straight away."
      />

      <Panel className="p-6 sm:p-7">
        <SettingRow
          title="Logo"
          hint="Shown in the header and the footer, and used as the icon in a browser tab. A PNG with a transparent background works best."
        >
          <LogoUpload />
        </SettingRow>

        <SettingRow
          title="Home page photo"
          hint="The large photo behind the headline on the home page. Wide, well-lit rooms work better than close-ups."
        >
          <HeroCoverUploader />
        </SettingRow>

        <SettingRow
          title="About photo"
          hint="The photo beside the story about the business, further down the home page."
          last
        >
          <AboutImageUploader />
        </SettingRow>
      </Panel>
    </div>
  );
}
