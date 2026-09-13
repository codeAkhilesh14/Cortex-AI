import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"

const thinkingLabels = ["Thinking", "Analyzing", "Reasoning", "Generating"]

const LoadingAnimation = () => {
  const [labelIndex, setLabelIndex] = useState(0)
  const label = thinkingLabels[labelIndex]

  useEffect(() => {
    const interval = setInterval(() => {
      setLabelIndex((current) => (current + 1) % thinkingLabels.length)
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className='flex items-center gap-3 max-w-[72%] py-1.5 text-slate-400'>
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <motion.div
          className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]"
          animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        {
            [0, 0.45, 0.9].map((delay, i)=>(
                <motion.div 
                    key={i}
                    className="absolute inset-0 rounded-full border border-cyan-400/30"
                    initial={{scale: 0.3, opacity: 0.55}}
                    animate={{scale: 1.7, opacity: 0}}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay,
                        ease: "easeOut"
                    }}
                />
            ))
        }
      </div>
      <div className="flex items-center gap-1.5">
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex items-center"
        >
          {
            label.split("").map((ch, i) => (
              <motion.span
                key={`${label}-${ch}-${i}`}
                className="text-[13px] font-medium tracking-wide text-slate-400"
                animate={{ opacity: [0.35, 1, 0.35], y: [0, -1, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.07,
                }}
              >
                {ch}
              </motion.span>
            ))
          }
        </motion.div>
        <div className="flex items-center gap-0.5 pt-1">
          {[0, 0.16, 0.32].map((delay, i) => (
            <motion.span
              key={i}
              className="h-1 w-1 rounded-full bg-slate-500"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingAnimation
