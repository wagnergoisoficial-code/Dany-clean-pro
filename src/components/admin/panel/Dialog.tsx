import { useEffect, useRef } from 'react';
import { Icon } from './Icons';

/**
 * Diálogo — marcação e classes do ficheiro aprovado.
 *
 * Usa o `<dialog>` nativo como no ficheiro, com `showModal`, por causa do que
 * ele traz de borda: o foco fica preso dentro, o Escape fecha, e o fundo
 * recebe `::backdrop`. Recriar isso à mão seria trabalho para ficar pior.
 */
export function Dialog({
  open, onClose, title, subtitle, children, footer, labelledBy = 'adm-dialog-title',
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  children: React.ReactNode; footer?: React.ReactNode; labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onCancel = (event: Event) => { event.preventDefault(); onClose(); };
    const onClickAway = (event: MouseEvent) => {
      if (event.target !== node) return;
      const box = node.getBoundingClientRect();
      const outside = event.clientX < box.left || event.clientX > box.right
        || event.clientY < box.top || event.clientY > box.bottom;
      if (outside) onClose();
    };
    node.addEventListener('cancel', onCancel);
    node.addEventListener('click', onClickAway);
    return () => { node.removeEventListener('cancel', onCancel); node.removeEventListener('click', onClickAway); };
  }, [onClose]);

  return (
    <dialog ref={ref} className="adm-dialog" aria-labelledby={labelledBy}>
      <header className="dialog-heading">
        <div><h2 id={labelledBy}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button type="button" className="icon-button" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
      </header>
      <div className="dialog-body">{children}</div>
      {footer && <footer className="dialog-footer">{footer}</footer>}
    </dialog>
  );
}

/** A confirmação destrutiva, com a mesma cópia e os mesmos botões do ficheiro. */
export function ConfirmDialog({
  open, title, copy, confirmLabel, onConfirm, onClose,
}: { open: boolean; title: string; copy: string; confirmLabel: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} labelledBy="adm-confirm-title"
      footer={<>
        <button type="button" className="button" onClick={onClose}>Cancel</button>
        <button type="button" className="button button-danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </>}>
      <p className="confirm-copy">{copy}</p>
    </Dialog>
  );
}
