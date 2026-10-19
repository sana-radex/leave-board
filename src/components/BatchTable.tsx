import "./BatchTable.css";
import type { BatchQuotaResponse, LeaveQuotaResponse } from "../types/types";
import { formatDate, formatHours, formatMonthDay } from "../utils/format";

interface BatchTableProps {
  /** 一個批次型假別的額度 */
  quota: LeaveQuotaResponse;
  /** 最後一列加上合計 */
  showTotal?: boolean;
}

/** 批次的標示：30 天內到期、尚未生效、彈性假已請／未請 */
function renderBatchTags(batch: BatchQuotaResponse, isFlex: boolean) {
  return (
    <>
      {batch.expiringSoon && <span className="tag tag-pending">30 天內到期</span>}
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

/** 批次表格（F-04）：有效中＋尚未生效的每一筆批次，用在我的額度頁與行事曆旁的詳情 */
function BatchTable({ quota, showTotal = false }: BatchTableProps) {
  if (quota.batches.length === 0) {
    return <p className="quota-empty">目前沒有任何批次</p>;
  }
  const isFlex = quota.leaveTypeId === "flex";
  return (
    <table className="batch-table">
      <thead>
        <tr>
          <th>批次</th>
          <th>有效期間</th>
          <th className="cell-number">總額</th>
          <th className="cell-number">已使用</th>
          <th className="cell-number">審核中</th>
          <th className="cell-number">可用</th>
          <th>標示</th>
        </tr>
      </thead>
      <tbody>
        {quota.batches.map((batch) => (
          <tr key={batch.id}>
            <td>{batch.name}</td>
            <td>
              {formatDate(batch.effectiveDate)}–{formatDate(batch.expiryDate)}
            </td>
            <td className="cell-number">{formatHours(batch.total)}</td>
            <td className="cell-number">{formatHours(batch.used)}</td>
            <td className="cell-number">{formatHours(batch.reserved)}</td>
            <td className="cell-number">{formatHours(batch.available)}</td>
            <td className="batch-tags">{renderBatchTags(batch, isFlex)}</td>
          </tr>
        ))}
      </tbody>
      {showTotal && (
        <tfoot>
          <tr>
            <td colSpan={2}>合計</td>
            <td className="cell-number">{formatHours(quota.total)}</td>
            <td className="cell-number">{formatHours(quota.used)}</td>
            <td className="cell-number">{formatHours(quota.reserved)}</td>
            <td className="cell-number">{formatHours(quota.available)}</td>
            <td></td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

export default BatchTable;
