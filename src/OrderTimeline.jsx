import React from "react";
import { Check, Clock, X, Truck, Package, AlertCircle } from "lucide-react";

export function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}

export function formatDateTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = d.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month} ${year} — ${hours}:${minutes} ${ampm}`;
}

export function OrderTimeline({ timeline = [], currentStatus = "Pending" }) {
  // If timeline is missing or empty, construct default based on currentStatus
  const items = (timeline && timeline.length > 0) ? timeline : [
    {
      status: "Pending",
      title: "Order Placed",
      timestamp: new Date().toISOString(),
      performedBy: "Retailer",
      role: "Retailer"
    }
  ];

  const getStepIcon = (itemStatus, index) => {
    if (itemStatus === "Rejected") return <X size={14} className="timeline-icon rejected" />;
    if (itemStatus === "Delivered") return <Truck size={14} className="timeline-icon delivered" />;
    if (itemStatus === "Accepted") return <Check size={14} className="timeline-icon accepted" />;
    return <Clock size={14} className="timeline-icon pending" />;
  };

  return (
    <div className="order-timeline-container">
      <h4 className="timeline-header">Status History</h4>
      <div className="timeline-list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <div key={idx} className={`timeline-item ${item.status.toLowerCase()}`}>
              <div className="timeline-badge-container">
                <div className={`timeline-badge ${item.status.toLowerCase()}`}>
                  {getStepIcon(item.status, idx)}
                </div>
                {!isLast && <div className="timeline-line" />}
              </div>
              <div className="timeline-content">
                <div className="timeline-title-row">
                  <span className="timeline-item-title">{item.title || item.status}</span>
                  <span className="timeline-relative">{formatRelativeTime(item.timestamp)}</span>
                </div>
                <div className="timeline-meta">
                  <span className="timeline-date">{formatDateTime(item.timestamp)}</span>
                  <span className="timeline-actor">• By {item.performedBy} ({item.role || "User"})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
