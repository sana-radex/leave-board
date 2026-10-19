import { Fragment, useEffect, useState } from "react";
import "./MyQuotaPage.css";
import type { LeaveQuotaResponse, LeaveTypeId } from "../types/types";
import { getMyQuota } from "../api/quotaApi";
import BatchTable from "../components/BatchTable";
import { formatHours } from "../utils/format";

/** 我的額度（F-04）：只看自己的 */
function MyQuotaPage() {
  const [loading, setLoading] = useState(true);
  const [quotaList, setQuotaList] = useState<LeaveQuotaResponse[]>([]);
  // 展開了哪些假別的批次
  const [expanded, setExpanded] = useState<LeaveTypeId[]>([]);

  // 首次進入，抓我的額度
  useEffect(() => {
    async function loadQuota() {
      setQuotaList(await getMyQuota());
      setLoading(false);
    }
    loadQuota();
  }, []);

  /** 展開／收合某個假別的批次 */
  function toggle(leaveTypeId: LeaveTypeId) {
    setExpanded((current) =>
      current.includes(leaveTypeId)
        ? current.filter((id) => id !== leaveTypeId)
        : [...current, leaveTypeId],
    );
  }

  return (
    <>
      <h1>我的額度</h1>
      {loading && <p>載入中...</p>}

      <div className="table-wrap">
        <table className="my-quota-table">
          <thead>
            <tr>
              <th>假別</th>
              <th className="cell-number">總額</th>
              <th className="cell-number">已使用</th>
              <th className="cell-number">審核中</th>
              <th className="cell-number">可用</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quotaList.map((quota) => {
              const isOpen = expanded.includes(quota.leaveTypeId);
              const hasExpiringSoon = quota.batches.some(
                (batch) => batch.expiringSoon,
              );

              // 婚假、喪假：只顯示每次額度，不顯示已使用
              if (quota.quotaType === "per_event") {
                return (
                  <tr key={quota.leaveTypeId}>
                    <td>{quota.leaveTypeName}</td>
                    <td colSpan={5}>
                      <div className="per-event-list">
                        {quota.perEvent.map((item) => (
                          <div key={item.label}>
                            {item.label && `${item.label}：`}每次{" "}
                            {formatHours(item.hours)}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <Fragment key={quota.leaveTypeId}>
                  <tr>
                    <td className="quota-type-name">
                      {quota.leaveTypeName}
                      {quota.quotaType === "yearly" && "（今年度）"}
                      {hasExpiringSoon && (
                        <span className="tag tag-pending">有批次即將到期</span>
                      )}
                    </td>
                    <td className="cell-number">{formatHours(quota.total)}</td>
                    <td className="cell-number">{formatHours(quota.used)}</td>
                    <td className="cell-number">{formatHours(quota.reserved)}</td>
                    <td className="cell-number quota-available-cell">
                      {formatHours(quota.available)}
                    </td>
                    <td className="cell-actions">
                      {quota.quotaType === "batch" && (
                        <button
                          onClick={() => toggle(quota.leaveTypeId)}
                          aria-expanded={isOpen}
                        >
                          {isOpen ? "收合批次" : "展開批次"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="batch-row">
                      <td colSpan={6}>
                        <BatchTable quota={quota} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default MyQuotaPage;
