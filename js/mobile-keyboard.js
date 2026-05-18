/* Mobile keyboard handling — keep the focused input visible above the iOS / Android
   on-screen keyboard. iOS in particular has a habit of leaving the focused input
   hidden behind the keyboard on long forms, especially when there's a sticky
   bottom save-bar.

   This script:
   1. Listens for focus on form inputs (input / textarea / select / contenteditable).
   2. Waits ~350ms for the keyboard to animate in.
   3. Scrolls the focused element to the centre of the viewport.
   4. Adds body.keyboard-open while an input is focused, so other CSS (e.g. hide
      a sticky save-bar) can react if it wants to.
*/
(function () {
  'use strict';
  // Only run on touch/mobile devices — desktop browsers don't need this.
  const isTouch =
    'ontouchstart' in window ||
    (navigator.maxTouchPoints > 0) ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isTouch) return;

  function isFormField(el) {
    if (!el || !el.tagName) return false;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) {
      // Skip non-text inputs (checkboxes, radios, buttons)
      if (el.tagName === 'INPUT') {
        const t = (el.type || 'text').toLowerCase();
        if (['checkbox','radio','button','submit','reset','file','range','color'].includes(t)) return false;
      }
      return true;
    }
    if (el.isContentEditable) return true;
    return false;
  }

  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (!isFormField(t)) return;
    document.body.classList.add('keyboard-open');
    // iOS keyboard animation is ~250-300ms. Wait then scroll.
    setTimeout(() => {
      try {
        // Re-check that the same element is still focused
        if (document.activeElement === t) {
          t.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (_) {}
    }, 350);
  });

  document.addEventListener('focusout', () => {
    // Give the next focusin a moment to fire (when user tabs between fields)
    setTimeout(() => {
      if (!isFormField(document.activeElement)) {
        document.body.classList.remove('keyboard-open');
      }
    }, 100);
  });
})();
