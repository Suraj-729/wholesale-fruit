import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, ShoppingCart, CheckCircle, XCircle, Truck, Inbox } from "lucide-react";
import { formatRelativeTime } from "./OrderTimeline";

export function NotificationBell({ notifications = [], unreadCount = 0, onMarkRead, onMarkAllRead, onSelectOrder }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const panelRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.isRead;
    return true;
  });

  const getItemIcon = (type) => {
    switch (type) {
      case "NEW_ORDER":
        return <ShoppingCart size={16} className="notif-icon new-order" />;
      case "ORDER_ACCEPTED":
        return <CheckCircle size={16} className="notif-icon accepted" />;
      case "ORDER_REJECTED":
        return <XCircle size={16} className="notif-icon rejected" />;
      case "ORDER_DELIVERED":
        return <Truck size={16} className="notif-icon delivered" />;
      default:
        return <Bell size={16} className="notif-icon default" />;
    }
  };

  return (
    <div className="notification-bell-container" ref={panelRef}>
      <button 
        className={`round bell ${unreadCount > 0 ? "has-unread" : ""}`} 
        onClick={() => setOpen(!open)}
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && <small className="bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</small>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notif-dropdown-header">
            <div className="notif-title-row">
              <h3>Notifications</h3>
              {unreadCount > 0 && <span className="unread-count-pill">{unreadCount} new</span>}
            </div>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={onMarkAllRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-tabs">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
              All ({notifications.length})
            </button>
            <button className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>
              Unread ({unreadCount})
            </button>
          </div>

          <div className="notif-list">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((item) => (
                <div
                  key={item._id || item.id}
                  className={`notif-item ${!item.isRead ? "unread" : ""}`}
                  onClick={() => {
                    if (!item.isRead && onMarkRead) onMarkRead(item._id);
                    if (onSelectOrder && item.orderId) onSelectOrder(item.orderId);
                    setOpen(false);
                  }}
                >
                  <div className="notif-item-left">
                    <span className="notif-icon-bubble">{getItemIcon(item.type)}</span>
                    {!item.isRead && <span className="unread-dot" />}
                  </div>

                  <div className="notif-item-body">
                    <div className="notif-item-top">
                      <strong>{item.title}</strong>
                      <small>{formatRelativeTime(item.createdAt)}</small>
                    </div>
                    <p className="notif-item-msg">{item.message}</p>
                    {item.orderId && <span className="notif-order-id">#{item.orderId}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="notif-empty-state">
                <Inbox size={28} />
                <p>{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
