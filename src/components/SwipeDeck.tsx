"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X, Heart, PartyPopper } from "lucide-react";

const SWIPE_THRESHOLD = 100;

export default function SwipeDeck<T>({
  items,
  getKey,
  renderCard,
  onSwipe,
  emptyState,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  onSwipe: (
    item: T,
    direction: "like" | "pass"
  ) => void | boolean | Promise<void | boolean>;
  emptyState: React.ReactNode;
}) {
  const [matchItem, setMatchItem] = useState<T | null>(null);

  const handleSwipe = async (item: T, direction: "like" | "pass") => {
    const result = await onSwipe(item, direction);
    if (direction === "like" && result !== false) {
      setMatchItem(item);
    }
  };

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  const visible = items.slice(0, 3);

  return (
    <div className="relative flex h-full w-full flex-col items-center">
      <div className="relative w-full max-w-sm flex-1">
        {visible
          .slice()
          .reverse()
          .map((item, revIdx) => {
            const idx = visible.length - 1 - revIdx;
            const isTop = idx === 0;
            return (
              <Card
                key={getKey(item)}
                isTop={isTop}
                depth={idx}
                onSwipe={(direction) => handleSwipe(item, direction)}
              >
                {renderCard(item)}
              </Card>
            );
          })}
      </div>

      {items[0] && (
        <div className="flex items-center justify-center gap-6 py-6">
          <ActionButton
            onClick={() => document.dispatchEvent(new CustomEvent("swipe-pass"))}
            variant="pass"
          />
          <ActionButton
            onClick={() => document.dispatchEvent(new CustomEvent("swipe-like"))}
            variant="like"
          />
        </div>
      )}

      <AnimatePresence>
        {matchItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/85 px-8 text-center"
            onClick={() => setMatchItem(null)}
          >
            <PartyPopper className="text-pink-500" size={56} />
            <h2 className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-3xl font-extrabold text-transparent">
              It&apos;s a Match!
            </h2>
            <p className="max-w-xs text-sm text-neutral-300">
              You liked it — find it in your Matches or Chat tab.
            </p>
            <button
              onClick={() => setMatchItem(null)}
              className="mt-2 rounded-full bg-pink-500 px-6 py-2 text-sm font-semibold text-white"
            >
              Keep Swiping
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({
  onClick,
  variant,
}: {
  onClick: () => void;
  variant: "pass" | "like";
}) {
  const isLike = variant === "like";
  return (
    <button
      onClick={onClick}
      className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 ${
        isLike
          ? "bg-gradient-to-br from-pink-500 to-orange-400 text-white"
          : "bg-neutral-800 text-neutral-300"
      }`}
      aria-label={isLike ? "Like" : "Pass"}
    >
      {isLike ? <Heart size={24} fill="white" /> : <X size={24} />}
    </button>
  );
}

function Card({
  children,
  isTop,
  depth,
  onSwipe,
}: {
  children: React.ReactNode;
  isTop: boolean;
  depth: number;
  onSwipe: (direction: "like" | "pass") => void;
}) {
  const [exitX, setExitX] = useState(0);

  const finishSwipe = (direction: "like" | "pass") => {
    setExitX(direction === "like" ? 500 : -500);
    onSwipe(direction);
  };

  const handleDragEnd = (
    _e: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      finishSwipe("like");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      finishSwipe("pass");
    }
  };

  useEffect(() => {
    if (!isTop) return;
    const like = () => finishSwipe("like");
    const pass = () => finishSwipe("pass");
    document.addEventListener("swipe-like", like);
    document.addEventListener("swipe-pass", pass);
    return () => {
      document.removeEventListener("swipe-like", like);
      document.removeEventListener("swipe-pass", pass);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop]);

  return (
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: 10 - depth }}
      initial={{ scale: 1 - depth * 0.05, y: depth * 10, opacity: depth === 2 ? 0 : 1 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 10, opacity: depth === 2 ? 0 : 1 }}
      exit={{
        x: exitX,
        opacity: 0,
        rotate: exitX > 0 ? 20 : -20,
        transition: { duration: 0.35 },
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileDrag={{ rotate: 8 }}
    >
      {children}
    </motion.div>
  );
}
