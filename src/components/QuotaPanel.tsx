import { useState } from "react";
import "./QuotaPanel.css";
import type { LeaveQuotaResponse, LeaveTypeId } from "../types/types";
import Modal from "./Modal";
import BatchTable from "./BatchTable";
import { formatHours } from "../utils/format";

interface QuotaPanelProps {
  /** 要顯示的額度：特休、彈性假、生日假 */
  quotaList: LeaveQuotaResponse[];
}

/** 行事曆右邊的我的額度（F-04）：每個假別顯示可用，按「詳情」看每一筆批次 */
function QuotaPanel({ quotaList }: QuotaPanelProps) {
  // 正在看詳情的假別
  const [selectedId, setSelectedId] = useState<LeaveTypeId | null>(null);
  const selected = quotaList.find((quota) => quota.leaveTypeId === selectedId);

  return (
    <section className="quota-panel">
      <h2>我的額度</h2>
      {quotaList.map((quota) => (
        <div key={quota.leaveTypeId} className="quota-item">
          <div>
            <div className="quota-name">
              {quota.leaveTypeName}
              {quota.batches.some((batch) => batch.expiringSoon) && (
                <span className="tag tag-pending">即將到期</span>
              )}
            </div>
            <div className="quota-available">
              可用 {formatHours(quota.available)}
            </div>
          </div>
          <button onClick={() => setSelectedId(quota.leaveTypeId)}>詳情</button>
        </div>
      ))}

      {selected && (
        <Modal
          title={`${selected.leaveTypeName}額度`}
          onClose={() => setSelectedId(null)}
        >
          <BatchTable quota={selected} showTotal />
        </Modal>
      )}
    </section>
  );
}

export default QuotaPanel;
