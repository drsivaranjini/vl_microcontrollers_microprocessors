'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Fades + slightly lifts children in as they scroll into view (Framer Motion, per
 * docs/12_REDESIGN_BRIEF.md v3 §1 stack choice). Respects prefers-reduced-motion via Framer's own
 * hook — motion values are JS-driven, not CSS transitions, so the global CSS
 * prefers-reduced-motion override in globals.css doesn't reach them on its own.
 */
export default function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px', amount: 0.1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
