import React, { useState, useEffect, useRef } from "react";
import { ShoppingCart, CheckCircle, XCircle, Truck, X } from "lucide-react";
import { formatRelativeTime } from "./OrderTimeline";

const MAX_VISIBLE_TOASTS = 3;
const AUTO_DISMISS_MS = 5000;

export function ToastContainer({ toastEvents, onToastClick, onDismissToast }) {
  const [visibleToasts, setVisibleToasts] = useState([]);
  const [queue, setQueue] = useState([]);
  const processedIdsRef = useRef(new Set());

  // Handle incoming new toast events
  useEffect(() => {
    if (!toastEvents || toastEvents.length === 0) return;

    toastEvents.forEach((toast) => {
      const toastId = toast._id || toast.id || `${toast.orderId}-${toast.type}-${Date.now()}`;
      if (processedIdsRef.current.has(toastId)) return;

      processedIdsRef.current.add(toastId);
      const newToast = { ...toast, id: toastId, createdAt: toast.createdAt || new Date().toISOString() };

      setVisibleToasts((prevVisible) => {
        if (prevVisible.length < MAX_VISIBLE_TOASTS) {
          return [...prevVisible, newToast];
        } else {
          setQueue((prevQueue) => [...prevQueue, newToast]);
          return prevVisible;
        }
      });
    });
  }, [toastEvents]);

  // Handle dismissal and dequeue next
  const dismissToast = (id) => {
    setVisibleToasts((prevVisible) => {
      const nextVisible = prevVisible.filter((t) => t.id !== id);
      setQueue((prevQueue) => {
        if (prevQueue.length > 0) {
          const [nextToast, ...remainingQueue] = prevQueue;
          nextVisible.push(nextToast);
          return remainingQueue;
        }
        return prevQueue;
      });
      return nextVisible;
    });

    if (onDismissToast) onDismissToast(id);
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "NEW_ORDER":
        return <ShoppingCart className="toast-type-icon new-order" size={20} />;
      case "ORDER_ACCEPTED":
        return <CheckCircle className="toast-type-icon accepted" size={20} />;
      case "ORDER_REJECTED":
        return <XCircle className="toast-type-icon rejected" size={20} />;
      case "ORDER_DELIVERED":
        return <Truck className="toast-type-icon delivered" size={20} />;
      default:
        return <ShoppingCart className="toast-type-icon default" size={20} />;
    }
  };

  return (
    <div className="toast-notifications-container">
      {visibleToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          icon={getToastIcon(toast.type)}
          onClose={() => dismissToast(toast.id)}
          onView={() => {
            if (onToastClick) onToastClick(toast.orderId);
            dismissToast(toast.id);
          }}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, icon, onClose, onView }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (exiting) {
      const exitTimer = setTimeout(() => {
        onClose();
      }, 300); // match fade-out animation duration
      return () => clearTimeout(exitTimer);
    }
  }, [exiting, onClose]);

  return (
    <div className={`popup-toast ${exiting ? "slide-out" : "slide-in"}`}>
      <div className="toast-head-bar">
        <div className="toast-icon-wrapper">{icon}</div>
        <div className="toast-header-text">
          <strong className="toast-title">{toast.title}</strong>
          <span className="toast-timestamp">{formatRelativeTime(toast.createdAt)}</span>
        </div>
        <button className="toast-close-btn" onClick={() => setExiting(true)} aria-label="Close notification">
          <X size={15} />
        </button>
      </div>

      <div className="toast-body-text">
        <p>{toast.message}</p>
        {toast.orderId && <span className="toast-order-badge">Order: #{toast.orderId}</span>}
      </div>

      <div className="toast-action-bar">
        <button className="toast-view-btn" onClick={onView}>
          View Order
        </button>
      </div>
    </div>
  );
}
