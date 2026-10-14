/**
 * Keep the page alive when a browser translates it.
 *
 * Chrome's built-in translator rewrites text nodes in place. React still holds
 * references to the originals, so the next time it updates a translated
 * subtree it asks a parent to remove or insert before a node that is no longer
 * there, and the DOM throws NotFoundError. React has no way to recover from
 * that mid-render, so the whole app unmounts — in our case into "Something went
 * wrong" on the first navigation after signing in, cleared by a refresh.
 *
 * The site is written in English and the people running it read Portuguese, so
 * the translator is going to be on. Turning it off with notranslate would make
 * the crash go away by making the site unreadable for them, which is the wrong
 * trade. Instead both operations become tolerant: if the node has already been
 * moved, there is nothing to undo, and inserting before a stranger appends
 * instead of throwing.
 *
 * Only these two methods are patched, only when they are about to fail, and
 * the real implementation handles every other case untouched.
 */
let warned = false;

function noteOnce(): void {
  if (warned) return;
  warned = true;
  console.info('[dom] a translated node was out of place; kept the page alive');
}

export function surviveTranslatedDom(): void {
  if (typeof Node === 'undefined' || !Node.prototype) return;

  const realRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function removeChild<T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      // Someone else already took it out. The caller wanted it gone, and it is.
      noteOnce();
      return child;
    }
    return realRemoveChild.call(this, child) as T;
  };

  const realInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBefore<T extends Node>(
    this: Node, node: T, child: Node | null,
  ): T {
    if (child && child.parentNode !== this) {
      // The anchor moved. Appending puts it in the right parent, which is the
      // part that matters; exact order within a translated run does not.
      noteOnce();
      return this.appendChild(node) as T;
    }
    return realInsertBefore.call(this, node, child) as T;
  };
}
