import { Fragment, useEffect, useState } from "react";
import "./MyQuotaPage.css";
import type {
  BatchQuotaResponse,
  LeaveQuotaResponse,
  LeaveTypeId,
} from "../types/types";
import { getMyQuota } from "../api/quotaApi";
import { formatDate, formatHours, formatMonthDay } from "../utils/format";

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

  /** 批次的標示：30 天內到期、尚未生效、彈性假已請／未請 */
  function renderBatchTags(batch: BatchQuotaResponse, isFlex: boolean) {
    return (
      <>
        {batch.expiringSoon && (
          <span className="tag tag-pending">30 天內到期</span>
        )}
        {batch.status === "upcoming" && (
          <span className="tag tag-makeup_workday">
            尚未生效（{formatMonthDay(batch.effectiveDate)} 起可請）
          </span>
        )}
        {isFlex && (
          <span className={batch.isTaken ? "tag tag-revoked" : "tag tag-approved"}>
            {batch.isTaken ? "已請" : "未請"}
          </span>
        )}
      </>
    );
  }

  /** 批次表格 */
  function renderBatchTable(batches: BatchQuotaResponse[], isFlex: boolean) {
    return (
      <table className="batch-table">
        <thead>
          <tr>
            <th>批次</th>
            <th>有效期間</th>
            <th>總額</th>
            <th>已使用</th>
            <th>審核中</th>
            <th>可用</th>
            <th>標示</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.id}>
              <td>{batch.name}</td>
              <td>
                {formatDate(batch.effectiveDate)}–{formatDate(batch.expiryDate)}
              </td>
              <td>{formatHours(batch.total)}</td>
              <td>{formatHours(batch.used)}</td>
              <td>{formatHours(batch.reserved)}</td>
              <td>{formatHours(batch.available)}</td>
              <td className="batch-tags">{renderBatchTags(batch, isFlex)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  /** 展開後的內容：有效中＋尚未生效的批次，已過期的收合在最後 */
  function renderBatches(quota: LeaveQuotaResponse) {
    const isFlex = quota.leaveTypeId === "flex";
    const current = quota.batches.filter((batch) => batch.status !== "expired");
    const expired = quota.batches.filter((batch) => batch.status === "expired");
    return (
      <>
        {current.length > 0 ? (
          renderBatchTable(current, isFlex)
        ) : (
          <p className="quota-empty">目前沒有任何批次</p>
        )}
        {expired.length > 0 && (
          <details className="expired-batches">
            <summary>已過期批次（{expired.length}）</summary>
            {renderBatchTable(expired, isFlex)}
          </details>
        )}
      </>
    );
  }

  return (
    <>
      <h1>我的額度</h1>
      {loading && <p>載入中...</p>}

      <table>
        <thead>
          <tr>
            <th>假別</th>
            <th>總額</th>
            <th>已使用</th>
            <th>審核中</th>
            <th>可用</th>
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
                    {quota.perEvent.map((item) => (
                      <div key={item.label}>
                        {item.label && `${item.label}：`}每次{" "}
                        {formatHours(item.hours)}
                      </div>
                    ))}
                  </td>
                </tr>
              );
            }

            return (
              <Fragment key={quota.leaveTypeId}>
                <tr>
                  <td>
                    {quota.leaveTypeName}
                    {quota.quotaType === "yearly" && "（今年度）"}
                    {hasExpiringSoon && (
                      <span className="tag tag-pending">有批次即將到期</span>
                    )}
                  </td>
                  <td>{formatHours(quota.total)}</td>
                  <td>{formatHours(quota.used)}</td>
                  <td>{formatHours(quota.reserved)}</td>
                  <td>{formatHours(quota.available)}</td>
                  <td>
                    {quota.quotaType === "batch" && (
                      <button onClick={() => toggle(quota.leaveTypeId)}>
                        {isOpen ? "收合批次" : "展開批次"}
                      </button>
                    )}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="batch-row">
                    <td colSpan={6}>{renderBatches(quota)}</td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default MyQuotaPage;
