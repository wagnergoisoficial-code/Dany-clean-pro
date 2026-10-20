import { Dialog } from './Dialog';

/** Central de ajuda — mesma estrutura do ficheiro, conteúdo deste negócio. */
export default function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose}
      title="Your panel, without the fuss" subtitle="Shortcuts and everyday actions."
      labelledBy="adm-help-title"
      footer={<button type="button" className="button button-primary" onClick={onClose}>Got it</button>}>
      <div className="help-list">
        <div>
          <h3>Book and organise</h3>
          <p>Use the blocks at the top to add a job, open your leads, or update the photos customers see. In the list you can edit a job, confirm the times the assistant held, release a slot, or delete it.</p>
        </div>
        <div>
          <h3>Find things quickly</h3>
          <p><kbd>⌘ / Ctrl + K</kbd> opens the search. Type a client or a town and press Enter.</p>
        </div>
        <div>
          <h3>Make it yours</h3>
          <p>In Settings you change the logo, the home page photo, and the picture beside your story. Those save on their own and go live straight away.</p>
        </div>
        <div>
          <h3>Who answers the phone</h3>
          <p>The assistant takes calls and texts, offers real times from this calendar, and holds the one your customer accepts. A held time waits here until you confirm it, and you get an e-mail the moment it happens.</p>
        </div>
      </div>
    </Dialog>
  );
}
