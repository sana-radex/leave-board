import { useState } from "react";
import type { CalendarFilter } from "../types/types";
import Modal from "./Modal";
import "./CalendarFilterModal.css";

interface CalendarFilterModalProps {
  /** 打開視窗時的篩選條件 */
  filter: CalendarFilter;
  /** 按下套用：把新的篩選條件交回去 */
  onApply: (newFilter: CalendarFilter) => void;
  /** 按下右上角的關閉：不套用 */
  onClose: () => void;
}

/** 行事曆篩選視窗：勾選要顯示哪些假單、哪些日子 */
function CalendarFilterModal({
  filter,
  onApply,
  onClose,
}: CalendarFilterModalProps) {
  // 先改草稿，按下套用才真的換到行事曆上
  const [draft, setDraft] = useState(filter);

  /** 切換某一類要不要顯示（只改草稿） */
  function toggle(key: keyof CalendarFilter) {
    setDraft({ ...draft, [key]: !draft[key] });
  }

  /** 全部勾回來 */
  function showAll() {
    setDraft({
      mine: true,
      others: true,
      revoked: true,
      holiday: true,
      makeup_workday: true,
    });
  }

  /** 一個勾選框：後面的文字用跟行事曆一樣的標籤顏色 */
  function renderCheckbox(
    key: keyof CalendarFilter,
    label: string,
    tagClassName: string,
  ) {
    return (
      <label className="filter-option">
        <input
          type="checkbox"
          checked={draft[key]}
          onChange={() => toggle(key)}
        />
        <span className={`tag ${tagClassName}`}>{label}</span>
      </label>
    );
  }

  return (
    <Modal
      title="篩選條件"
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={showAll}>
            全部顯示
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={() => onApply(draft)}
          >
            套用
          </button>
        </>
      }
    >
      <fieldset className="filter-group">
        <legend className="filter-title">假單</legend>
        {renderCheckbox("mine", "我的假單", "tag-mine")}
        {renderCheckbox("others", "其他人的假單", "tag-approved")}
        {renderCheckbox("revoked", "已撤銷", "tag-revoked")}
      </fieldset>

      <fieldset className="filter-group">
        <legend className="filter-title">辦公日曆</legend>
        {renderCheckbox("holiday", "國定假日", "tag-holiday")}
        {renderCheckbox("makeup_workday", "補班日", "tag-makeup_workday")}
      </fieldset>
    </Modal>
  );
}

export default CalendarFilterModal;
