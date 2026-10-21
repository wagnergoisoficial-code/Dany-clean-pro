import type React from 'react';

/**
 * What a tap on a contact link does, besides following it.
 *
 * Calling the number also opens the in-page voice assistant, so someone at a
 * computer, where a tel: link may do nothing, still reaches someone. A text
 * link on a computer opens the "text us" window instead of an sms: link that
 * goes nowhere. Both overlays live in App.
 */
export function triggerAICall() {
  window.dispatchEvent(new CustomEvent('trigger-ai-call'));
}

export function handleSMSLaunch(e: React.MouseEvent<HTMLAnchorElement>) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('trigger-sms-fallback'));
  }
}
