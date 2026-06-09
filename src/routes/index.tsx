import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Home })

// ── Photo Data ──────────────────────────────────────────────────────────────

const PHOTOS = Array.from({ length: 22 }, (_, i) =>
  `/scx/SCX_100d_${String(i + 1).padStart(2, '0')}.JPG`,
)

const KEN_BURNS_CLASSES = [
  'ken-burns-right',
  'ken-burns-left',
  'ken-burns-up',
  'ken-burns-down',
] as const

const AUTOPLAY_INTERVAL = 7000 // 7 seconds per photo
const IDLE_TIMEOUT = 3000 // hide controls after 3s

// ── Home Component ──────────────────────────────────────────────────────────

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [progress, setProgress] = useState(0)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const preloadRef = useRef<HTMLImageElement | null>(null)

  const total = PHOTOS.length

  // Pick a Ken Burns direction per photo (stable by index)
  const kenBurnsClass = KEN_BURNS_CLASSES[currentIndex % KEN_BURNS_CLASSES.length]

  // ── Preload next photo ──────────────────────────────────────────────────

  useEffect(() => {
    const nextIndex = (currentIndex + 1) % total
    const img = new Image()
    img.src = PHOTOS[nextIndex]
    preloadRef.current = img
  }, [currentIndex, total])

  // ── Autoplay timer ──────────────────────────────────────────────────────

  useEffect(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current)
    if (progressRef.current) clearInterval(progressRef.current)

    if (!isPlaying) {
      setProgress(0)
      return
    }

    setProgress(0)
    const startTime = Date.now()

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min((elapsed / AUTOPLAY_INTERVAL) * 100, 100))
    }, 50)

    autoplayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total)
    }, AUTOPLAY_INTERVAL)

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [isPlaying, currentIndex, total])

  // ── Mouse idle detection ────────────────────────────────────────────────

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      setShowControls(false)
    }, IDLE_TIMEOUT)
  }, [])

  // ── Keyboard controls ───────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goPrev()
      } else if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Initial load animation ──────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 300)
    return () => clearTimeout(t)
  }, [])

  // ── Navigation helpers ──────────────────────────────────────────────────

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(index)
    },
    [],
  )

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p)
  }, [])

  // ── Pad counter ─────────────────────────────────────────────────────────

  const paddedCurrent = String(currentIndex + 1).padStart(2, '0')
  const paddedTotal = String(total).padStart(2, '0')

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-dark-canvas select-none"
      onMouseMove={handleMouseMove}
    >
      {/* ── Photo Layer ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{
            opacity: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
            scale: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
          }}
        >
          <div
            className={`absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center ${kenBurnsClass}`}
            style={{
              backgroundImage: `url(${PHOTOS[currentIndex]})`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Vignette ── */}
      <div className="vignette" />

      {/* ── Controls Layer ── */}
      <motion.div
        className="fixed inset-0 z-30 flex flex-col justify-between pointer-events-none"
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* ── Top Bar ── */}
        <motion.div
          className="flex items-center justify-between px-8 pt-7"
          initial={{ opacity: 0, y: -20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Title */}
          <div className="pointer-events-auto">
            <h1
              className="text-white/60 text-sm tracking-[0.35em] uppercase font-light"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Darkroom
            </h1>
            <div className="mt-1.5 h-px w-16 bg-gradient-to-r from-warm-amber/40 to-transparent" />
          </div>

          {/* Photo Counter */}
          <div
            className="text-white/40 text-sm tracking-[0.2em] font-light tabular-nums"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-warm-amber">{paddedCurrent}</span>
            <span className="mx-2 text-white/20">/</span>
            <span>{paddedTotal}</span>
          </div>
        </motion.div>

        {/* ── Bottom Controls ── */}
        <motion.div
          className="flex flex-col items-center gap-5 pb-8 px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Progress Bar */}
          <div className="w-full max-w-2xl progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Navigation Row */}
          <div className="flex items-center gap-6 pointer-events-auto">
            {/* Prev */}
            <button className="nav-btn" onClick={goPrev} aria-label="Previous photo">
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>

            {/* Play / Pause */}
            <button className="play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}
            </button>

            {/* Next */}
            <button className="nav-btn" onClick={goNext} aria-label="Next photo">
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center gap-2">
            {PHOTOS.map((_, i) => (
              <button
                key={i}
                className={`photo-dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
