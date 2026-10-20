import { Fragment, useEffect, useState } from "react";
import "./MyQuotaPage.css";
import type { LeaveTypeId } from "../types/domain";
import type { LeaveQuotaResponse } from "../types/api";
import { getMyQuota } from "../api/quotaApi";
import BatchTable from "../components/BatchTable";
import InfoTooltip from "../components/InfoTooltip";
import { formatHours } from "../utils/format";

/** 我的額度：只看自己的 */
function MyQuotaPage() {
  const [loading, setLoading] = useState(true);
  const [quotaList, setQuotaList] = useState<LeaveQuotaResponse[]>([]);
  const [expanded, setExpanded] = useState<LeaveTypeId[]>([]);

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

  /** 額度欄位：婚假、喪假沒有總額可算，顯示「—」 */
  function renderHours(quota: LeaveQuotaResponse, hours: number) {
    if (quota.quotaType === "per_event") {
      return <span className="quota-none">—</span>;
    }
    return formatHours(hours);
  }

  return (
    <>
      <h1>我的額度</h1>
      {loading && <p>載入中...</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>假別</th>
              <th className="cell-number">總額</th>
              <th className="cell-number">已使用</th>
              <th className="cell-number">審核中</th>
              <th className="cell-number">可用</th>
            </tr>
          </thead>
          <tbody>
            {quotaList.map((quota) => {
              const isOpen = expanded.includes(quota.leaveTypeId);
              const hasExpiringSoon = quota.batches.some(
                (batch) => batch.expiringSoon,
              );

              return (
                <Fragment key={quota.leaveTypeId}>
                  <tr>
                    <td>
                      <div className="quota-type-name">
                        {quota.quotaType === "batch" ? (
                          <button
                            className="expand-button"
                            onClick={() => toggle(quota.leaveTypeId)}
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "收合批次" : "展開批次"}
                            title={isOpen ? "收合批次" : "展開批次"}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              aria-hidden="true"
                            >
                              <path
                                d="M6 3l5 5-5 5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        ) : (
                          <span className="expand-button-space"></span>
                        )}
                        <span>
                          {quota.leaveTypeName}
                          {quota.quotaType === "yearly" && "（今年度）"}
                        </span>
                        <InfoTooltip label={`${quota.leaveTypeName}說明`}>
                          <p>{quota.leaveTypeDescription}</p>
                        </InfoTooltip>
                        {hasExpiringSoon && (
                          <span className="tag tag-pending">
                            有批次即將到期
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="cell-number">
                      {renderHours(quota, quota.total)}
                    </td>
                    <td className="cell-number">
                      {renderHours(quota, quota.used)}
                    </td>
                    <td className="cell-number">
                      {renderHours(quota, quota.reserved)}
                    </td>
                    <td className="cell-number quota-available-cell">
                      {renderHours(quota, quota.available)}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="batch-row">
                      <td colSpan={5}>
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
