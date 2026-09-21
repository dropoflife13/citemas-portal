// lib/useBodyScrollLock.js
'use client';

import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';
let originalPosition = '';
let originalTop = '';
let originalWidth = '';
let savedScrollY = 0;

/**
 * Global counter-based body scroll lock hook for modals.
 * Handles scrollbar shift compensation and iOS Safari rubber-band scrolling.
 *
 * @param {boolean} isOpen - Whether the modal is currently open.
 */
export function useBodyScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;
      originalPosition = document.body.style.position;
      originalTop = document.body.style.top;
      originalWidth = document.body.style.width;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
    }

    lockCount += 1;

    return () => {
      lockCount -= 1;

      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;

        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isOpen]);
}

