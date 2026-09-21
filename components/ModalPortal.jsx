// components/ModalPortal.jsx
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable ModalPortal component that renders modal children into a dedicated #modal-root
 * element at document.body level using React.createPortal.
 *
 * Provides:
 * - High z-index stacking above fixed Navbars (z-[100])
 * - Full-screen backdrop with black/70 blur
 * - Escape key listener to trigger onClose
 * - Backdrop and letterbox click to trigger onClose (prevented on modal content)
 * - Single inner wrapper with max-h-[90vh] overflow-y-auto for panel scrolling
 * - SSR safety (renders null on server)
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Modal inner content
 * @param {boolean} [props.isOpen=true] - Whether modal is open
 * @param {Function} [props.onClose] - Callback when backdrop or Escape key is pressed
 */
export default function ModalPortal({ children, isOpen = true, onClose }) {
  const [container, setContainer] = useState(null);

  // SSR-safe container setup (created once on mount, reused by all modals)
  useEffect(() => {
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      document.body.appendChild(modalRoot);
    }
    setContainer(modalRoot);
  }, []);

  // Escape key listener attached when open and cleaned up on close/unmount
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Returns null if closed or before client-side hydration
  if (!container || !isOpen) return null;

  // Backdrop click handler (closing modal when backdrop or letterbox padding is clicked directly)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Portal rendering into #modal-root
  return createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] overflow-y-auto"
      >
        {children}
      </div>
    </div>,
    container
  );
}
