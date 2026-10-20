import { useState } from "react";
import type { CalendarDayType, LeaveStatus } from "../types/domain";
import type { CalendarFilter } from "../types/ui";
import { calendarDayTypeLabels, statusLabels } from "../utils/label";
import { createShowAllFilter } from "../utils/calendarFilter";
import Modal from "./Modal";
import "./CalendarFilterModal.css";

/** 所有假單狀態，依 statusLabels 的順序 */
const STATUSES = Object.keys(statusLabels) as LeaveStatus[];

interface CalendarFilterModalProps {
  /** 打開視窗時的篩選條件 */
  filter: CalendarFilter;
  /** 按下套用：把新的篩選條件交回去 */
  onApply: (newFilter: CalendarFilter) => void;
  /** 按下右上角的關閉：不套用 */
  onClose: () => void;
}

/** 行事曆篩選視窗：我的假單依狀態勾選，其他人的假單（只有已核准）、國定假日、補班日各一個 */
function CalendarFilterModal({
  filter,
  onApply,
  onClose,
}: CalendarFilterModalProps) {
  // 先改草稿，按下套用才真的換到行事曆上
  const [draft, setDraft] = useState(filter);

  /** 切換我的假單某個狀態要不要顯示（只改草稿） */
  function toggleMineStatus(status: LeaveStatus) {
    setDraft({
      ...draft,
      mine: { ...draft.mine, [status]: !draft.mine[status] },
    });
  }

  /** 切換其他人、國定假日或補班日要不要顯示（只改草稿） */
  function toggle(key: "others" | CalendarDayType) {
    setDraft({ ...draft, [key]: !draft[key] });
  }

  /** 一個勾選框：後面的文字用跟行事曆一樣的標籤樣式 */
  function renderCheckbox(
    checked: boolean,
    onToggle: () => void,
    label: string,
    tagClassName: string,
  ) {
    return (
      <label key={label} className="filter-option">
        <input type="checkbox" checked={checked} onChange={onToggle} />
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
          <button type="button" onClick={() => setDraft(createShowAllFilter())}>
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
      <div className="filter-columns">
        <fieldset className="filter-group">
          <legend className="filter-title">我的假單</legend>
          {STATUSES.map((status) =>
            renderCheckbox(
              draft.mine[status],
              () => toggleMineStatus(status),
              statusLabels[status],
              `tag-${status}`,
            ),
          )}
        </fieldset>

        <div>
          <fieldset className="filter-group">
            <legend className="filter-title">其他人</legend>
            {renderCheckbox(
              draft.others,
              () => toggle("others"),
              "其他人的假單",
              "tag-others",
            )}
          </fieldset>

          <fieldset className="filter-group">
            <legend className="filter-title">辦公日曆</legend>
            {renderCheckbox(
              draft.holiday,
              () => toggle("holiday"),
              calendarDayTypeLabels.holiday,
              "tag-holiday",
            )}
            {renderCheckbox(
              draft.makeup_workday,
              () => toggle("makeup_workday"),
              calendarDayTypeLabels.makeup_workday,
              "tag-makeup_workday",
            )}
          </fieldset>
        </div>
      </div>
    </Modal>
  );
}

export default CalendarFilterModal;
