import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, titulo, children }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-black/[0.05]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05]">
              <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">{titulo}</h2>
              <button onClick={onClose} className="p-2 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
