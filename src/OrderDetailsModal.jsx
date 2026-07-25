import React from "react";
import { X, Check, XCircle, Truck, Package, Store, Calendar, CreditCard } from "lucide-react";
import { OrderTimeline, formatDateTime } from "./OrderTimeline";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function OrderDetailsModal({ order, user, onClose, onUpdateStatus }) {
  if (!order) return null;

  const isPending = order.Status === "Pending";
  const isAccepted = order.Status === "Accepted";
  const isRejected = order.Status === "Rejected";
  const isDelivered = order.Status === "Delivered";

  return (
    <>
      <div className="shade" onClick={onClose} />
      <div className="order-details-modal">
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
              <span className="summary-label"><Package size={14} /> Fruit Lot</span>
              <strong className="summary-value">{order.FruitName}</strong>
              <small>{order.Quantity} box(es) ({order.PackageType})</small>
            </div>

            <div className="summary-card">
              <span className="summary-label"><CreditCard size={14} /> Total Price</span>
              <strong className="summary-value price">{money.format(Number(order.Total))}</strong>
              <small>Price/box: {money.format(Number(order.Price))}</small>
            </div>

            <div className="summary-card">
              <span className="summary-label"><Calendar size={14} /> Order Date</span>
              <strong className="summary-value">{formatDateTime(order.OrderDate)}</strong>
              <small>Status: <span className={`status-pill ${order.Status.toLowerCase()}`}>{order.Status}</span></small>
            </div>
          </div>

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
