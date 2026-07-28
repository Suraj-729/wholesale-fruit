import React from "react";
import { X, Check, XCircle, Truck, Package, Store, Calendar, CreditCard, ShoppingBag } from "lucide-react";
import { OrderTimeline, formatDateTime } from "./OrderTimeline";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function OrderDetailsModal({ order, user, onClose, onUpdateStatus }) {
  if (!order) return null;

  const isPending = order.Status === "Pending";
  const isAccepted = order.Status === "Accepted";
  const isRejected = order.Status === "Rejected";
  const isDelivered = order.Status === "Delivered";

  const hasMultipleItems = Array.isArray(order.Items) && order.Items.length > 0;

  return (
    <>
      <div className="shade" onClick={onClose} />
      <div className="order-details-modal" style={{ maxWidth: "680px" }}>
        <div className="modal-header">
          <div>
            <span className="order-modal-badge">Order Details</span>
            <h2>#{order.OrderID}</h2>
          </div>
          <button className="round close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="order-summary-grid">
            <div className="summary-card">
              <span className="summary-label"><Store size={14} /> Retailer</span>
              <strong className="summary-value">{order.RetailerName}</strong>
              <small>{order.RetailerMobile}</small>
            </div>

            <div className="summary-card">
              <span className="summary-label"><Package size={14} /> Total Quantity</span>
              <strong className="summary-value">{order.Quantity} box(es)</strong>
              <small>{hasMultipleItems ? `${order.Items.length} products ordered` : order.PackageType}</small>
            </div>

            <div className="summary-card">
              <span className="summary-label"><CreditCard size={14} /> Grand Total</span>
              <strong className="summary-value price">{money.format(Number(order.Total))}</strong>
              <small>{hasMultipleItems ? "Combined Order Total" : `Price/box: ${money.format(Number(order.Price))}`}</small>
            </div>

            <div className="summary-card">
              <span className="summary-label"><Calendar size={14} /> Order Date</span>
              <strong className="summary-value">{formatDateTime(order.OrderDate)}</strong>
              <small>Status: <span className={`status-pill ${order.Status.toLowerCase()}`}>{order.Status}</span></small>
            </div>
          </div>

          {/* Itemized breakdown table for multi-product orders */}
          {hasMultipleItems && (
            <div style={{ marginTop: "16px", background: "#f8fbf9", borderRadius: "12px", padding: "14px", border: "1px solid #e1ebe3" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                <ShoppingBag size={16} color="var(--green)" /> Products in this Order ({order.Items.length} items)
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #d3e2d7", textAlign: "left", color: "#54685c" }}>
                    <th style={{ padding: "6px" }}>Product</th>
                    <th style={{ padding: "6px" }}>Package</th>
                    <th style={{ padding: "6px", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "6px", textAlign: "right" }}>Price/box</th>
                    <th style={{ padding: "6px", textAlign: "right" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.Items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #edf4ee" }}>
                      <td style={{ padding: "8px 6px", fontWeight: "700" }}>{item.FruitName}</td>
                      <td style={{ padding: "8px 6px", color: "#54685c" }}>{item.PackageType}</td>
                      <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700" }}>{item.Quantity} box(es)</td>
                      <td style={{ padding: "8px 6px", textAlign: "right" }}>{money.format(Number(item.Price))}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: "800", color: "var(--green)" }}>{money.format(Number(item.Total || item.Quantity * item.Price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <OrderTimeline timeline={order.Timeline} currentStatus={order.Status} />

          {user?.role === "Admin" && !isDelivered && !isRejected && (
            <div className="modal-action-bar">
              {isPending && (
                <>
                  <button className="accept-btn" onClick={() => onUpdateStatus(order, "Accepted")}>
                    <Check size={16} /> Accept Order
                  </button>
                  <button className="reject-btn" onClick={() => onUpdateStatus(order, "Rejected")}>
                    <XCircle size={16} /> Reject Order
                  </button>
                </>
              )}

              {isAccepted && (
                <button className="deliver-btn" onClick={() => onUpdateStatus(order, "Delivered")}>
                  <Truck size={16} /> Mark as Delivered
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
