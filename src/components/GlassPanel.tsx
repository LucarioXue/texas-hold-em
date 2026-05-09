import { motion, type HTMLMotionProps } from 'framer-motion'

type Props = HTMLMotionProps<'div'> & {
  children: React.ReactNode
  className?: string
}

export default function GlassPanel({ children, className = '', ...props }: Props) {
  return (
    <motion.div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
