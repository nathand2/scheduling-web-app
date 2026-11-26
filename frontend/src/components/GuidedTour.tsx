import { useEffect, useRef, useState } from "react";
import "../styles/GuidedTour.css";

export interface GuidedTourStep {
  target: string;
  title: string;
  content: string;
  actionPrompt?: boolean;
}

interface GuidedTourProps {
  open: boolean;
  paused?: boolean;
  steps: GuidedTourStep[];
  actionVersion?: number;
  startDelayMs?: number;
  onClose: () => void;
}

interface TargetRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

const GuidedTour = ({ open, paused = false, steps, actionVersion = 0, startDelayMs = 900, onClose }: GuidedTourProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [actionComplete, setActionComplete] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const wasOpen = useRef(false);
  const lastActionVersion = useRef(actionVersion);
  const introTimer = useRef<number | undefined>(undefined);
  const step = steps[stepIndex];

  useEffect(() => {
    if (open && !wasOpen.current) {
      setStepIndex(0);
      setActionComplete(false);
      setIntroVisible(false);
    } else if (!open) {
      setIntroVisible(false);
    }
    wasOpen.current = open;
    if (open && !introVisible && introTimer.current === undefined) {
      introTimer.current = window.setTimeout(() => setIntroVisible(true), startDelayMs);
    }
    return () => {
      if (introTimer.current !== undefined) {
        window.clearTimeout(introTimer.current);
        introTimer.current = undefined;
      }
    };
  }, [open, introVisible, startDelayMs]);

  useEffect(() => {
    if (actionVersion !== lastActionVersion.current) {
      lastActionVersion.current = actionVersion;
      if (step?.actionPrompt) setActionComplete(true);
    }
  }, [actionVersion, step]);

  useEffect(() => {
    if (!open || paused || !introVisible || !step) return;

    let animationFrame = 0;
    const element = document.querySelector(step.target) as HTMLElement | null;
    if (!element) {
      setTargetRect(null);
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const updateRect = () => {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateRect);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(scheduleUpdate);
    resizeObserver?.observe(element);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      resizeObserver?.disconnect();
    };
  }, [open, paused, introVisible, step]);

  useEffect(() => {
    if (!open || paused) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setStepIndex((index) => Math.min(index + 1, steps.length - 1));
      }
      if (event.key === "ArrowLeft") setStepIndex((index) => Math.max(index - 1, 0));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, paused, step, actionComplete, steps.length, onClose]);

  if (!open || paused || !introVisible || !step) return null;

  const goNext = () => {
    if (stepIndex === steps.length - 1) onClose();
    else setStepIndex((index) => index + 1);
  };
  const cardWidth = Math.min(360, window.innerWidth - 24);
  const cardLeft = targetRect
    ? Math.min(Math.max(12, targetRect.left + targetRect.width / 2 - cardWidth / 2), window.innerWidth - cardWidth - 12)
    : Math.max(12, (window.innerWidth - cardWidth) / 2);
  const cardTop = targetRect
    ? targetRect.bottom + 18 < window.innerHeight - 220
      ? targetRect.bottom + 18
      : Math.max(12, targetRect.top - 220)
    : Math.max(24, window.innerHeight / 2 - 110);

  return (
    <>
      {targetRect && (
        <svg key={`shade-${stepIndex}`} className="guided-tour-shade guided-tour-step-shade" aria-hidden="true">
          <defs>
            <mask id="guided-tour-spotlight-mask" maskUnits="userSpaceOnUse">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 7}
                y={targetRect.top - 7}
                width={targetRect.width + 14}
                height={targetRect.height + 14}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(8, 20, 32, 0.4)" mask="url(#guided-tour-spotlight-mask)" />
        </svg>
      )}
      <section
        key={`card-${stepIndex}`}
        className="guided-tour-card guided-tour-step-card"
        role="dialog"
        aria-modal="false"
        aria-labelledby="guided-tour-title"
        style={{ left: cardLeft, top: cardTop, width: cardWidth }}
      >
        <div className="guided-tour-progress">Step {stepIndex + 1} of {steps.length}</div>
        <h2 id="guided-tour-title">{step.title}</h2>
        <p>{step.content}</p>
        {step.actionPrompt && (
          <p className="guided-tour-action-hint">
            {actionComplete
              ? "Availability saved. Continue when ready."
              : "Try adding a range now, or continue if you prefer."}
          </p>
        )}
        <div className="guided-tour-controls">
          <button type="button" className="guided-tour-skip" onClick={onClose}>Skip tour</button>
          <div>
            <button
              type="button"
              className="guided-tour-secondary"
              onClick={() => {
                setStepIndex((index) => Math.max(index - 1, 0));
              }}
              disabled={stepIndex === 0}
            >
              Back
            </button>
            <button
              type="button"
              className="guided-tour-primary"
              onClick={goNext}
            >
              {stepIndex === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default GuidedTour;
