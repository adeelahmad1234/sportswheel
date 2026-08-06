import { motion, AnimatePresence } from 'framer-motion'

export default function SpinAgainButton({ show, onClick, accentColor }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          onClick={onClick}
          className="fixed bottom-8 right-8 z-40 flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm tracking-wide shadow-2xl"
          style={{
            background: accentColor,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 0 30px ${accentColor}88, 0 4px 20px rgba(0,0,0,0.5)`,
          }}
        >
          <span style={{ fontSize: 16 }}>↺</span>
          Spin Again
        </motion.button>
      )}
    </AnimatePresence>
  )
}
