"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function MotionPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function Tap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }} className={className}>
      {children}
    </motion.div>
  );
}
