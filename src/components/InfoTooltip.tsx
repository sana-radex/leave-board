import { useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./InfoTooltip.css";

/** 說明框最寬多少，要跟 CSS 的 max-width 一樣；靠近畫面右邊時用來往左移 */
const TOOLTIP_MAX_WIDTH = 320;

/** 說明框和圖示之間、和畫面邊緣之間留的空 */
const GAP = 8;

interface InfoTooltipProps {
  /** 說明的內容 */
  children: ReactNode;
  /** 圖示按鈕的名稱，給螢幕閱讀器念，例如「特休說明」 */
  label: string;
}

/** 說明框的位置：在圖示下面用 top，在圖示上面用 bottom */
interface TooltipPosition {
  left: number;
  top?: number;
  bottom?: number;
}

/**
 * i 圖示：滑鼠移上去（或用鍵盤移到）時顯示說明。
 * 說明框畫在 body 底下、用 fixed 定位，放在表格裡才不會被表格的捲動區切掉
 */
function InfoTooltip({ children, label }: InfoTooltipProps) {
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  // 說明框的位置；null 表示沒有顯示
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  /** 顯示說明框：圖示在畫面下半部就往上開，不然往下開 */
  function show() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    // 太靠右時往左移，不要超出畫面
    const left = Math.max(
      GAP,
      Math.min(rect.left, window.innerWidth - TOOLTIP_MAX_WIDTH - GAP),
    );
    if (rect.top > window.innerHeight / 2) {
      setPosition({ left, bottom: window.innerHeight - rect.top + GAP });
    } else {
      setPosition({ left, top: rect.bottom + GAP });
    }
  }

  function hide() {
    setPosition(null);
  }

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className="info-tooltip-button"
        aria-label={label}
        aria-describedby={position ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => {
          if (e.key === "Escape") hide();
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="6.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M8 7.25v3.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="5" r="0.9" fill="currentColor" />
        </svg>
      </button>
      {position &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className="info-tooltip"
            style={position}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

export default InfoTooltip;
