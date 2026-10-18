import { useState } from "react";
import type {
  CalendarDayType,
  CalendarFilter,
  CalendarFilterKey,
  LeaveStatus,
} from "../types/types";
import { calendarDayTypeLabels, statusLabels } from "../utils/label";
import Modal from "./Modal";
import "./CalendarFilterModal.css";

interface CalendarFilterModalProps {
  /** 打開視窗時的篩選條件 */
  filter: CalendarFilter;
  /** 按下完成：把新的篩選條件交回去 */
  onDone: (newFilter: CalendarFilter) => void;
}

/** 行事曆篩選視窗：勾選要顯示哪些假單狀態、哪些日子 */
function CalendarFilterModal({ filter, onDone }: CalendarFilterModalProps) {
  // 先改「草稿」，按下完成才真的套用到行事曆
  const [draft, setDraft] = useState(filter);

  /** 切換某一項要不要顯示（只改草稿） */
  function toggle(key: CalendarFilterKey) {
    setDraft({ ...draft, [key]: !draft[key] });
  }

  /** 畫出一個勾選框 */
  function renderCheckbox(key: CalendarFilterKey, label: string) {
    return (
      <label key={key}>
        <input
          type="checkbox"
          checked={draft[key]}
          onChange={() => toggle(key)}
        />
        <span className={`tag tag-${key}`}>{label}</span>
      </label>
    );
  }

  return (
    <Modal title="篩選條件">
      <div className="filter-group">
        <p className="filter-title">假單狀態</p>
        {Object.entries(statusLabels).map(([status, label]) =>
          renderCheckbox(status as LeaveStatus, label),
        )}
      </div>

      <div className="filter-group">
        <p className="filter-title">辦公日曆</p>
        {Object.entries(calendarDayTypeLabels).map(([type, label]) =>
          renderCheckbox(type as CalendarDayType, label),
        )}
      </div>

      <button onClick={() => onDone(draft)}>完成</button>
    </Modal>
  );
}

export default CalendarFilterModal;
