import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import { ArrowRight, ArrowUp, Bell, Box, CalendarDays, Check, ChevronDown, CircleCheck, Clock3, Eye, GripVertical, Image, LayoutDashboard, MapPin, Menu, Minus, Package, PackageCheck, Plus, Search, ShoppingCart, Sparkles, Store, Trash2, Truck, Upload, Users, X, XCircle, Zap } from "lucide-react";
import "./styles.css";
import "./connected.css";

import appleImg from "./assets/apple.png";
import bananaImg from "./assets/banana.png";
import mangoImg from "./assets/mango.png";
import orangeImg from "./assets/orange.png";
import grapeImg from "./assets/grape.png";
import melonImg from "./assets/melon.png";

import { NotificationBell } from "./NotificationBell";
import { ToastContainer } from "./ToastContainer";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { OfferCarousel } from "./OfferCarousel";

const fruitImages = {
  apple: appleImg,
  banana: bananaImg,
  mango: mangoImg,
  orange: orangeImg,
  grape: grapeImg,
  melon: melonImg
};

const getFruitShade = (name) => {
  if (!name) return "melon";
  const n = name.toLowerCase();
  if (n.includes("apple")) return "apple";
  if (n.includes("banana")) return "banana";
  if (n.includes("mango")) return "mango";
  if (n.includes("orange")) return "orange";
  if (n.includes("grape")) return "grape";
  return "melon";
};

const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (apiUrl.startsWith("http")) {
    return apiUrl.replace(/\/api\/?$/, "");
  }
  return undefined;
};
const socketUrl = getSocketUrl();
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const fallbackFruits = [
  { FruitID: "FR001", FruitName: "Kashmiri Gala Apples", PackageType: "20 KG Box", AvailableQuantity: 70, Price: 2180, CreatedDate: "2026-07-01" },
  { FruitID: "FR002", FruitName: "Yelakki Golden Banana", PackageType: "18 KG Crate", AvailableQuantity: 90, Price: 920, CreatedDate: "2026-07-01" },
  { FruitID: "FR003", FruitName: "Alphonso Mangoes", PackageType: "6 Dozen Carton", AvailableQuantity: 45, Price: 3650, CreatedDate: "2026-07-01" },
];
const blankFruit = { fruitName: "", packageType: "", availableQuantity: "", price: "", imageUrl: "" };

function Pill({ children, tone = "soft" }) { return <span className={`pill ${tone}`}>{children}</span>; }
function Brand() { return <div className="brand"><i>F</i><b>Fruit<span>Lane</span></b></div>; }
function Stat({ icon, top, bottom }) { return <div className="stat"><span>{icon}</span><p><b>{top}</b><small>{bottom}</small></p></div>; }

function QuantityStepper({ quantity, onIncrease, onDecrease, max, disabled }) {
  return (
    <div className="quantity-stepper">
      <button 
        type="button" 
        className="stepper-btn minus" 
        onClick={(e) => { e.stopPropagation(); onDecrease(); }} 
        disabled={disabled || quantity <= 0}
        aria-label="Decrease quantity"
      >
        <Minus size={18} strokeWidth={2.5} />
      </button>
      <span className="stepper-count">{quantity}</span>
      <button 
        type="button" 
        className="stepper-btn plus" 
        onClick={(e) => { e.stopPropagation(); onIncrease(); }} 
        disabled={disabled || (max !== undefined && quantity >= max)}
        aria-label="Increase quantity"
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function Header({ page, setPage, cartTotalCount, user, notifications, unreadCount, onMarkRead, onMarkAllRead, onSelectOrder, onCart, onLogin, onLogout, onAdmin }) {
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const go = (next) => { setPage(next); setMenu(false); };
  return <header><div className="header-inner"><Brand />
    <nav className={menu ? "open" : ""}>
      <button className={page === "market" ? "active" : ""} onClick={() => go("market")}>Buy fruits</button>
      {(!user || user.role === "Admin") && (
        <button className={page === "admin" ? "active" : ""} onClick={onAdmin}>Wholesale desk</button>
      )}
      {user?.role === "Retailer" && (
        <button className={page === "my-orders" ? "active" : ""} onClick={() => go("my-orders")}>My Orders</button>
      )}
      {(!user || user.role === "Admin") && (
        <button className={page === "delivery" ? "active" : ""} onClick={() => user?.role === "Admin" ? go("delivery") : onAdmin()}>Orders</button>
      )}
    </nav>
    <div className="head-actions">
      <NotificationBell 
        notifications={notifications} 
        unreadCount={unreadCount} 
        onMarkRead={onMarkRead} 
        onMarkAllRead={onMarkAllRead} 
        onSelectOrder={onSelectOrder} 
      />

      <button className="cart" onClick={onCart}><ShoppingCart size={18} /><span>Cart</span>{cartTotalCount > 0 && <b>{cartTotalCount}</b>}</button>
      {user ? (
        <div className="profile-container">
          <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
            <span className="profile-avatar">{(user.retailerName || user.username || "U")[0].toUpperCase()}</span>
            <span>Profile</span>
            <ChevronDown size={14} />
          </button>
          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <h4>{user.retailerName || user.username}</h4>
                <p>{user.role}</p>
              </div>
              <div className="profile-dropdown-details">
                {user.shopName && <span>Shop: <strong>{user.shopName}</strong></span>}
                {user.mobileNumber && <span>Mobile: <strong>{user.mobileNumber}</strong></span>}
              </div>
              <button className="profile-dropdown-logout" onClick={() => { setProfileOpen(false); onLogout(); }}>
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <button className="login-mini" onClick={onLogin}>Login</button>
      )}
      <button className="round menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
    </div>
  </div></header>;
}

function Product({ fruit, quantityInCart, onUpdateQuantity }) {
  const shade = getFruitShade(fruit.FruitName);
  const stock = Number(fruit.AvailableQuantity);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

  return (
    <article className={`product ${isOutOfStock ? "out-of-stock-card" : ""}`}>
      <div className={`product-art ${shade}`}>
        <Pill tone={isOutOfStock ? "danger" : isLowStock ? "soft" : "white"}>
          {isOutOfStock ? "OUT OF STOCK ❌" : isLowStock ? "Low stock" : "In stock"}
        </Pill>
        <img 
          src={fruit.imageUrl || fruitImages[shade]} 
          alt={fruit.FruitName} 
          className="product-image" 
        />
      </div>
      <div className="product-body">
        <div className="name">
          <h3>{fruit.FruitName}</h3>
          <small className={isOutOfStock ? "stock-tag red" : "stock-tag green"}>
            {isOutOfStock ? "0 boxes left" : `${stock} boxes left`}
          </small>
        </div>
        <p className="origin"><Box size={14} />{fruit.PackageType}</p>
        <div className="price"><strong>{money.format(Number(fruit.Price))}</strong><span>/ box</span></div>
        <div className="product-bottom">
          <Pill>{fruit.FruitID}</Pill>
          <span>Available: <b style={{ color: isOutOfStock ? "#d9381e" : "#175c39" }}>{stock}</b></span>
          {quantityInCart > 0 && !isOutOfStock ? (
            <QuantityStepper 
              quantity={quantityInCart} 
              onIncrease={() => onUpdateQuantity(fruit, 1)} 
              onDecrease={() => onUpdateQuantity(fruit, -1)} 
              max={stock} 
              disabled={isOutOfStock}
            />
          ) : (
            <button 
              className={isOutOfStock ? "out-of-stock-btn" : ""} 
              disabled={isOutOfStock} 
              onClick={() => onUpdateQuantity(fruit, 1)}
            >
              {!isOutOfStock && <Plus size={16} />}
              {isOutOfStock ? "Out of Stock" : "Add"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Market({ fruits, loading, banners, getCartQuantity, onUpdateQuantity }) {
  const [search, setSearch] = useState("");
  const list = useMemo(() => fruits.filter((fruit) => `${fruit.FruitName} ${fruit.PackageType}`.toLowerCase().includes(search.toLowerCase())), [fruits, search]);
  return <main>
    <OfferCarousel banners={banners} />

    <section className="quick-stats"><Stat icon={<CalendarDays />} top="Live inventory" bottom="From the Fruits sheet" /><Stat icon={<Box />} top={`${fruits.length} fruit lots`} bottom="Updated by wholesaler" /><Stat icon={<Truck />} top="COD available" bottom="Pay on delivery" /></section>
    <section className="catalog" id="catalog"><div className="section-title"><div><Pill>Today's wholesale catalog</Pill><h2>Buy by the crate, <em>save on every order.</em></h2></div></div><div className="tools"><label><Search size={20} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fruit or package type" /></label><span><i /> {loading ? "Refreshing inventory..." : "Live inventory from warehouse"}</span></div><div className="product-grid">{list.map((fruit) => <Product key={fruit.FruitID} fruit={fruit} quantityInCart={getCartQuantity(fruit.FruitID)} onUpdateQuantity={onUpdateQuantity} />)}</div>{!loading && list.length === 0 && <div className="no-results">No matching fresh lots today.</div>}</section>
  </main>;
}

function FruitForm({ form, setForm, onSubmit, editing, onCancel, busy, notice }) {
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleFruitImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      if (notice) notice("Fruit photo file size exceeds 1MB limit! Please upload a smaller photo.", true);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, imageUrl: reader.result }));
      if (notice) notice("Fruit photo attached ready to save.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <form className="fruit-form" onSubmit={onSubmit}>
      <label>Fruit name<input required name="fruitName" value={form.fruitName} onChange={update} placeholder="e.g. Kinnaur Apples" /></label>
      <label>Package type<input required name="packageType" value={form.packageType} onChange={update} placeholder="e.g. 20 KG Box" /></label>
      <label>Available boxes (Stock)<input required min="0" type="number" name="availableQuantity" value={form.availableQuantity} onChange={update} /></label>
      <label>Price per box<input required min="0" type="number" name="price" value={form.price} onChange={update} /></label>
      <label>Fruit Photo (Optional, Max 1MB)
        <small style={{ display: "block", color: "#476053", fontSize: "11px", margin: "2px 0 4px", fontWeight: "normal" }}>
          📸 Attach custom fruit photo (Max file size: <strong>1MB</strong>)
        </small>
        <input type="file" accept="image/*" onChange={handleFruitImageChange} style={{ padding: "6px" }} />
        {form.imageUrl && <small style={{ color: "var(--green)", display: "block", marginTop: "4px" }}>✓ Fruit photo attached</small>}
      </label>
      <div className="form-actions">
        <button disabled={busy} className="primary">{editing ? "Save changes" : "Add fruit"} <ArrowRight size={16} /></button>
        {editing && <button type="button" className="outline" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function Admin({ user, fruits, setFruits, loading, banners, refreshBanners, request, refresh, notice }) {
  const [form, setForm] = useState(blankFruit);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [retailer, setRetailer] = useState({ mobileNumber: "", retailerName: "", shopName: "", address: "", password: "" });
  const [retailerBusy, setRetailerBusy] = useState(false);
  const [resetData, setResetData] = useState({ targetMobileNumber: "", newPassword: "", adminPassword: "" });
  const [resetBusy, setResetBusy] = useState(false);

  // Drag and drop & touch state for reordering fruits
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const touchStartIdxRef = useRef(null);

  const saveFruitOrder = async (newOrderedFruits) => {
    if (setFruits) setFruits(newOrderedFruits);
    try {
      const fruitIds = newOrderedFruits.map((f) => f.FruitID);
      await request("/fruits/reorder", {
        method: "PUT",
        body: JSON.stringify({ fruitIds })
      });
      notice("Inventory order updated! Position #1 fruit is now shown first to retailers.");
    } catch (error) {
      notice(error.message || "Failed to save fruit order", true);
      refresh();
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIdx(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    const sourceIdxStr = e.dataTransfer.getData("text/plain");
    const sourceIdx = draggedIdx !== null ? draggedIdx : parseInt(sourceIdxStr, 10);
    setDraggedIdx(null);
    setDragOverIdx(null);

    if (isNaN(sourceIdx) || sourceIdx === targetIdx || sourceIdx < 0 || sourceIdx >= fruits.length) return;

    const updated = [...fruits];
    const [draggedItem] = updated.splice(sourceIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);
    saveFruitOrder(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Touch drag support for mobile finger slide
  const handleTouchStart = (e, index) => {
    touchStartIdxRef.current = index;
    setDraggedIdx(index);
  };

  const handleTouchMove = (e) => {
    if (touchStartIdxRef.current === null) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetEl) return;
    const rowEl = targetEl.closest(".manage-row[data-index]");
    if (rowEl) {
      const overIndex = parseInt(rowEl.getAttribute("data-index"), 10);
      if (!isNaN(overIndex) && overIndex !== dragOverIdx) {
        setDragOverIdx(overIndex);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartIdxRef.current !== null && dragOverIdx !== null && touchStartIdxRef.current !== dragOverIdx) {
      const sourceIdx = touchStartIdxRef.current;
      const targetIdx = dragOverIdx;
      const updated = [...fruits];
      const [draggedItem] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, draggedItem);
      saveFruitOrder(updated);
    }
    touchStartIdxRef.current = null;
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const moveToTop = (index) => {
    if (index === 0) return;
    const updated = [...fruits];
    const [item] = updated.splice(index, 1);
    updated.unshift(item);
    saveFruitOrder(updated);
  };

  // Banner form state
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    tag: "50% OFF",
    bgGradient: "emerald",
    buttonText: "Shop Wholesale Crates",
    imageUrl: ""
  });
  const [bannerBusy, setBannerBusy] = useState(false);

  const edit = (fruit) => { setEditing(fruit); setForm({ fruitName: fruit.FruitName, packageType: fruit.PackageType, availableQuantity: fruit.AvailableQuantity, price: fruit.Price, imageUrl: fruit.imageUrl || "" }); };
  const reset = () => { setEditing(null); setForm(blankFruit); };
  const save = async (event) => { event.preventDefault(); setBusy(true); try { await request(`/fruits${editing ? `/${editing.FruitID}` : ""}`, { method: editing ? "PUT" : "POST", body: JSON.stringify(form) }); notice(editing ? "Fruit updated for all retailers." : "Fruit added to the live catalog."); reset(); refresh(); } catch (error) { notice(error.message, true); } finally { setBusy(false); } };
  const remove = async (fruit) => { if (!window.confirm(`Remove ${fruit.FruitName} from the live catalog?`)) return; try { await request(`/fruits/${fruit.FruitID}`, { method: "DELETE" }); notice("Fruit removed from the live catalog."); refresh(); } catch (error) { notice(error.message, true); } };
  const registerRetailer = async (event) => { event.preventDefault(); setRetailerBusy(true); try { await request("/retailers", { method: "POST", body: JSON.stringify(retailer) }); notice("Retailer registered. They can now login with their mobile number and password."); setRetailer({ mobileNumber: "", retailerName: "", shopName: "", address: "", password: "" }); } catch (error) { notice(error.message, true); } finally { setRetailerBusy(false); } };
  
  const resetUserPassword = async (event) => {
    event.preventDefault();
    setResetBusy(true);
    try {
      await request("/reset-user-password", {
        method: "PUT",
        body: JSON.stringify({
          adminUsername: user?.username || "admin",
          adminPassword: resetData.adminPassword,
          targetMobileNumber: resetData.targetMobileNumber,
          newPassword: resetData.newPassword
        })
      });
      notice("Retailer password reset successfully!");
      setResetData({ targetMobileNumber: "", newPassword: "", adminPassword: "" });
    } catch (error) {
      notice(error.message, true);
    } finally {
      setResetBusy(false);
    }
  };

  // Image Upload handler with 2MB limit check
  const handleBannerImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notice("Image size exceeds 2MB limit! Please upload a smaller image file.", true);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerForm((prev) => ({ ...prev, imageUrl: reader.result }));
      notice("Banner image attached successfully.");
    };
    reader.readAsDataURL(file);
  };

  const handleAddBanner = async (event) => {
    event.preventDefault();
    if (!bannerForm.title.trim() && !bannerForm.imageUrl) {
      notice("Please enter a Banner Title OR upload a Banner Image.", true);
      return;
    }

    setBannerBusy(true);
    try {
      await request("/banners", {
        method: "POST",
        body: JSON.stringify(bannerForm)
      });
      notice("New offer banner published successfully!");
      setBannerForm({ title: "", subtitle: "", tag: "50% OFF", bgGradient: "emerald", buttonText: "Shop Wholesale Crates", imageUrl: "" });
      refreshBanners();
    } catch (error) {
      notice(error.message, true);
    } finally {
      setBannerBusy(false);
    }
  };

  const handleDeleteBanner = async (bannerId, title) => {
    if (!window.confirm(`Delete banner ${title ? `"${title}"` : ""}?`)) return;
    try {
      await request(`/banners/${bannerId}`, { method: "DELETE" });
      notice("Banner deleted successfully!");
      refreshBanners();
    } catch (error) {
      notice(error.message, true);
    }
  };

  const boxCount = fruits.reduce((total, fruit) => total + Number(fruit.AvailableQuantity || 0), 0);
  return <main className="page"><div className="page-head"><div><Pill>Admin workspace</Pill><h1>Manage the <em>live fruit catalog.</em></h1><p>Every change is saved in the database and appears to retailers instantly.</p></div></div>
    <div className="metrics"><Metric icon={<Package />} label="Fruit lots" value={fruits.length} note="Active in catalog" /><Metric icon={<Box />} label="Available boxes" value={boxCount} note="Across all fruits" /><Metric icon={<Sparkles />} label="Offer Banners" value={banners.length} note="Live on homepage" /><Metric icon={<PackageCheck />} label="Source" value="DB" note="Shared inventory" /></div>
    <div className="manage-grid"><section className="panel"><PanelTitle title={editing ? `Editing ${editing.FruitID}` : "Add a new fruit"} sub="Required fields become a new database record" /><FruitForm form={form} setForm={setForm} onSubmit={save} editing={editing} onCancel={reset} busy={busy} notice={notice} /></section>
      <section className="panel">
        <PanelTitle title="Live inventory" sub={loading ? "Refreshing..." : `${fruits.length} items in DB`} />
        
        <div className="reorder-hint">
          <GripVertical size={16} /> <span><strong>Slide / Drag to Reorder:</strong> Drag fruit rows up or down using cursor (desktop) or finger (mobile) to set #1 stock priority for retailers.</span>
        </div>

        <div className="manage-table">
          <div className="manage-head">
            <span></span>
            <span>Pos</span>
            <span>Fruit</span>
            <span>Package</span>
            <span>Stock</span>
            <span>Price</span>
            <span>Actions</span>
          </div>
          {fruits.map((fruit, index) => {
            const isDragging = draggedIdx === index;
            const isDragOver = dragOverIdx === index;
            const isTop = index === 0;

            return (
              <div
                className={`manage-row ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
                key={fruit.FruitID}
                data-index={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div
                  className="drag-handle"
                  title="Touch or click & drag to slide up/down"
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <GripVertical size={18} />
                </div>

                <div>
                  <span className={`pos-badge ${isTop ? "top-pos" : ""}`}>
                    #{index + 1}
                  </span>
                </div>

                <b>
                  {fruit.FruitName}
                  <small>{fruit.FruitID}</small>
                </b>

                <span>{fruit.PackageType}</span>

                <span>{fruit.AvailableQuantity}</span>

                <span>{money.format(Number(fruit.Price))}</span>

                <span>
                  {!isTop && (
                    <button
                      type="button"
                      className="make-top-btn"
                      title="Move item to #1 position instantly to clear stock fast"
                      onClick={() => moveToTop(index)}
                    >
                      <Zap size={12} /> #1 Top
                    </button>
                  )}
                  <button className="text" onClick={() => edit(fruit)}>Edit</button>
                  <button className="danger" onClick={() => remove(fruit)}>
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </section></div>
    
    {/* Offer Banners Management Panel */}
    <div className="manage-grid" style={{ marginTop: "24px" }}>
      <section className="panel">
        <PanelTitle title="Add Festive Offer Banner" sub="Write text banner OR directly upload graphic image" />
        <form className="fruit-form" onSubmit={handleAddBanner}>
          <label>Upload Graphic Banner Image (Direct Upload)
            <small style={{ display: "block", color: "#476053", fontSize: "11px", margin: "2px 0 6px", fontWeight: "normal" }}>
              📐 Recommended Dimensions: <strong>1200 × 400 px</strong> (3:1 Aspect Ratio) • Max size: <strong>2MB</strong>
            </small>
            <input type="file" accept="image/*" onChange={handleBannerImageChange} style={{ padding: "8px" }} />
            {bannerForm.imageUrl && <small style={{ color: "var(--green)", display: "block", marginTop: "4px" }}>✓ Graphic image attached ready to upload</small>}
          </label>

          <div style={{ margin: "4px 0", textAlign: "center", fontSize: "11px", color: "var(--muted)", fontWeight: "bold" }}>
            — OR OPTIONALLY ADD OVERLAY TEXT —
          </div>

          <label>Banner Title (Optional)
            <input value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} placeholder="e.g. Holi Sale 50% OFF 🎨" />
          </label>

          <label>Subtitle / Description (Optional)
            <input value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} placeholder="e.g. Flat 50% discount on Kashmiri Apples!" />
          </label>

          <label>Offer Tag / Badge (Optional)
            <input value={bannerForm.tag} onChange={(e) => setBannerForm({ ...bannerForm, tag: e.target.value })} placeholder="e.g. 50% OFF, DIWALI DEAL" />
          </label>

          <label>Gradient Theme Preset (Optional)
            <select value={bannerForm.bgGradient} onChange={(e) => setBannerForm({ ...bannerForm, bgGradient: e.target.value })}>
              <option value="emerald">🌿 Emerald Fresh (Rich Forest Green)</option>
              <option value="holi">🎨 Holi Festive (Vibrant Red/Pink/Gold)</option>
              <option value="diwali">✨ Diwali Dhamaka (Glowing Lights Purple/Pink)</option>
              <option value="sunset">⚡ Sunset Flash (Warm Neon Orange)</option>
              <option value="midnight">🌙 Midnight Sale (Dark Blue Indigo)</option>
            </select>
          </label>

          <label>Action Button Label (Optional)
            <input value={bannerForm.buttonText} onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })} placeholder="e.g. Shop Wholesale Crates" />
          </label>

          <div className="form-actions">
            <button disabled={bannerBusy} className="primary">
              Publish Banner <Upload size={16} />
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <PanelTitle title="Active Offer Banners" sub={`${banners.length} banners live in carousel`} />
        <div className="admin-banner-grid">
          {banners.map((b) => (
            <div key={b._id || b.title} className={`banner-admin-card ${b.bgGradient || "holi"}`} style={b.imageUrl ? { backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(${b.imageUrl})`, backgroundSize: "cover" } : {}}>
              <div className="banner-admin-top">
                <span className="offer-tag-badge">{b.tag || "OFFER"}</span>
              </div>
              <div>
                <h4>{b.title}</h4>
                <p>{b.subtitle}</p>
              </div>
              <button className="banner-delete-btn" onClick={() => handleDeleteBanner(b._id, b.title)}>
                <Trash2 size={13} /> Delete Banner
              </button>
            </div>
          ))}
          {banners.length === 0 && <div className="no-results">No active banners. Add one using the form on the left!</div>}
        </div>
      </section>
    </div>

    <div className="manage-grid" style={{ marginTop: "24px" }}>
      <section className="panel retailer-registration"><PanelTitle title="Register a retailer" sub="Creates a new account" /><form className="fruit-form retailer-form" onSubmit={registerRetailer}><label>Mobile number<input required pattern="[0-9]{10}" maxLength="10" value={retailer.mobileNumber} onChange={(event) => setRetailer({ ...retailer, mobileNumber: event.target.value.replace(/\D/g, "") })} placeholder="10-digit mobile number" /></label><label>Retailer name<input required value={retailer.retailerName} onChange={(event) => setRetailer({ ...retailer, retailerName: event.target.value })} placeholder="Owner name" /></label><label>Shop name<input required value={retailer.shopName} onChange={(event) => setRetailer({ ...retailer, shopName: event.target.value })} placeholder="Shop name" /></label><label>Address<input required value={retailer.address} onChange={(event) => setRetailer({ ...retailer, address: event.target.value })} placeholder="Business address" /></label><label>Password<input required type="password" value={retailer.password} onChange={(event) => setRetailer({ ...retailer, password: event.target.value })} placeholder="Initial Password" /></label><div className="form-actions"><button disabled={retailerBusy} className="primary">Register retailer <Users size={16} /></button></div></form></section>
      
      <section className="panel retailer-registration"><PanelTitle title="Reset Retailer Password" sub="Assign a new password to a retailer" /><form className="fruit-form retailer-form" onSubmit={resetUserPassword}><label>Retailer Mobile Number<input required pattern="[0-9]{10}" maxLength="10" value={resetData.targetMobileNumber} onChange={(event) => setResetData({ ...resetData, targetMobileNumber: event.target.value.replace(/\D/g, "") })} placeholder="10-digit mobile number" /></label><label>New Password<input required type="password" value={resetData.newPassword} onChange={(event) => setResetData({ ...resetData, newPassword: event.target.value })} placeholder="New Password" /></label><label>Confirm Admin Password<input required type="password" value={resetData.adminPassword} onChange={(event) => setResetData({ ...resetData, adminPassword: event.target.value })} placeholder="Your Admin Password" /></label><div className="form-actions"><button disabled={resetBusy} className="primary">Reset Password</button></div></form></section>
    </div>
  </main>;
}

function Metric({ icon, label, value, note }) { return <article className="metric"><span>{icon}</span><p>{label}</p><h2>{value}</h2><small>{note}</small></article>; }
function PanelTitle({ title, sub }) { return <div className="panel-title"><div><h2>{title}</h2><p>{sub}</p></div></div>; }

const formatOrderDateTime = (dateStr) => {
  if (!dateStr) return { date: "", time: "" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return { date, time };
};

function Orders({ request, notice, orders, loadOrders, loading, onSelectOrder, onUpdateStatus }) {
  useEffect(() => {
    loadOrders();
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const timeA = a.OrderDate ? new Date(a.OrderDate).getTime() : 0;
      const timeB = b.OrderDate ? new Date(b.OrderDate).getTime() : 0;
      return timeB - timeA;
    });
  }, [orders]);

  return <main className="page">
    <div className="page-head">
      <div>
        <Pill>Order management</Pill>
        <h1>Every crate, <em>right on time.</em></h1>
        <p>Real-time order processing with instant retailer notifications.</p>
      </div>
    </div>
    
    <div className="metrics" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      <Metric icon={<Clock3 />} label="Pending" value={orders.filter(o => o.Status === "Pending").length} note="Requires review" />
      <Metric icon={<Check />} label="Accepted" value={orders.filter(o => o.Status === "Accepted").length} note="In delivery pipeline" />
      <Metric icon={<Truck />} label="Delivered" value={orders.filter(o => o.Status === "Delivered").length} note="Order completed" />
      <Metric icon={<XCircle />} label="Rejected" value={orders.filter(o => o.Status === "Rejected").length} note="Cancelled/Declined" />
    </div>

    <section className="panel">
      <PanelTitle title="All Orders" sub={loading ? "Loading orders..." : `${orders.length} orders total (Sorted by Date & Time)`} />
      {sortedOrders.map((order) => {
        const { date, time } = formatOrderDateTime(order.OrderDate);
        return (
          <div className="order-row order-live" key={order.OrderID} style={{ gridTemplateColumns: "auto 1.4fr 1.25fr auto auto" }}>
            <span className="avatar">{order.RetailerName?.[0] || "R"}</span>
            <div>
              <b style={{ fontSize: "14px" }}>{order.RetailerName}</b>
              <small style={{ display: "block", color: "var(--muted)", fontSize: "11px" }}>
                #{order.OrderID} • {order.FruitName} x {order.Quantity} box(es)
              </small>
            </div>
            
            {/* Middle Column: Amount + Date & Time */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <strong style={{ fontSize: "14px", color: "var(--green)" }}>{money.format(Number(order.Total))}</strong>
              {date ? (
                <small style={{ fontSize: "11px", color: "#4f6055", display: "inline-flex", alignItems: "center", gap: "3px", flexWrap: "nowrap" }}>
                  <CalendarDays size={12} color="var(--green)" /> {date}
                  <Clock3 size={12} color="var(--green)" style={{ marginLeft: "4px" }} /> {time}
                </small>
              ) : null}
            </div>

            <Pill tone={order.Status === "Delivered" ? "lime" : order.Status === "Rejected" ? "danger" : order.Status === "Accepted" ? "lime" : "soft"}>
              {order.Status}
            </Pill>
            <div style={{ display: "flex", gap: "6px" }}>
              <button className="text" onClick={() => onSelectOrder(order.OrderID)} title="View timeline & details">
                <Eye size={15} /> Details
              </button>
              {order.Status === "Pending" && (
                <>
                  <button className="text" style={{ color: "#287d4a" }} onClick={() => onUpdateStatus(order, "Accepted")}>
                    Accept
                  </button>
                  <button className="text" style={{ color: "#b24a32" }} onClick={() => onUpdateStatus(order, "Rejected")}>
                    Reject
                  </button>
                </>
              )}
              {order.Status === "Accepted" && (
                <button className="text" style={{ color: "#0284c7" }} onClick={() => onUpdateStatus(order, "Delivered")}>
                  Deliver
                </button>
              )}
            </div>
          </div>
        );
      })}
      {!loading && !orders.length && <div className="no-results">No orders have been placed yet.</div>}
    </section>
  </main>;
}

function RetailerOrders({ user, request, notice, orders, loadOrders, loading, onSelectOrder }) {
  useEffect(() => {
    loadOrders();
  }, [user?.mobileNumber]);

  const totalOrderedBoxes = orders.reduce((sum, o) => sum + (Number(o.Quantity) || 0), 0);
  const totalDeliveredBoxes = orders.filter(o => o.Status === "Delivered").reduce((sum, o) => sum + (Number(o.Quantity) || 0), 0);
  
  const totalOrderedValue = orders.reduce((sum, o) => sum + (Number(o.Total) || 0), 0);
  const totalDeliveredValue = orders.filter(o => o.Status === "Delivered").reduce((sum, o) => sum + (Number(o.Total) || 0), 0);
  const pendingValue = orders.filter(o => o.Status === "Pending" || o.Status === "Accepted").reduce((sum, o) => sum + (Number(o.Total) || 0), 0);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <Pill>Retailer Panel</Pill>
          <h1>Track your <em>orders.</em></h1>
          <p>Instant real-time updates and status timeline from the warehouse.</p>
        </div>
      </div>

      <div className="metrics" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Metric 
          icon={<Package />} 
          label="Total Ordered" 
          value={`${totalOrderedBoxes} Box${totalOrderedBoxes !== 1 ? "es" : ""}`} 
          note={`Total Value: ${money.format(totalOrderedValue)}`} 
        />
        <Metric 
          icon={<Truck />} 
          label="Delivered" 
          value={`${totalDeliveredBoxes} Box${totalDeliveredBoxes !== 1 ? "es" : ""}`} 
          note={`Value: ${money.format(totalDeliveredValue)}`} 
        />
        <Metric 
          icon={<Clock3 />} 
          label="Pending Delivery" 
          value={`${totalOrderedBoxes - totalDeliveredBoxes} Box${(totalOrderedBoxes - totalDeliveredBoxes) !== 1 ? "es" : ""}`} 
          note={`Pending Value: ${money.format(pendingValue)}`} 
        />
      </div>

      <section className="panel">
        <PanelTitle title="Your Order History" sub={loading ? "Refreshing..." : `${orders.length} orders total`} />
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
          {orders.map((order) => (
            <div 
              key={order.OrderID} 
              className="order-row" 
              style={{ gridTemplateColumns: "auto 1.5fr 1fr auto auto", cursor: "pointer" }}
              onClick={() => onSelectOrder(order.OrderID)}
            >
              <span className="avatar" style={{ background: order.Status === "Delivered" ? "#e0f2df" : order.Status === "Rejected" ? "#fde9e3" : "#fff0d7", color: order.Status === "Delivered" ? "#287d4a" : order.Status === "Rejected" ? "#b24a32" : "#cd7b19" }}>
                {order.FruitName?.[0] || "F"}
              </span>
              <div>
                <b style={{ fontSize: "14px", color: "var(--ink)" }}>{order.FruitName}</b>
                <small style={{ display: "block", color: "var(--muted)", fontSize: "11px", marginTop: "2px" }}>
                  Order ID: #{order.OrderID} • Date: {new Date(order.OrderDate).toLocaleDateString()}
                </small>
              </div>
              <div>
                <span style={{ fontSize: "13px", display: "block" }}>
                  Quantity: <strong>{order.Quantity}</strong> {order.Quantity === 1 ? "box" : "boxes"} ({order.PackageType})
                </span>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                  Price/box: {money.format(Number(order.Price))}
                </small>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                <strong style={{ fontSize: "14px", color: "var(--green)" }}>{money.format(Number(order.Total))}</strong>
                <Pill tone={order.Status === "Delivered" ? "lime" : order.Status === "Rejected" ? "danger" : "soft"}>
                  {order.Status}
                </Pill>
              </div>
              <button className="text" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); onSelectOrder(order.OrderID); }}>
                <Eye size={15} />
              </button>
            </div>
          ))}
          {!loading && !orders.length && (
            <div className="no-results" style={{ padding: "40px 0" }}>
              You haven't placed any orders yet. Visit "Buy fruits" to place your first order!
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Cart({ cartItems, onUpdateQuantity, onRemoveItem, close, checkout, user, onLogin }) {
  const totalBoxes = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalMoney = cartItems.reduce((sum, item) => sum + (item.quantity * Number(item.fruit.Price)), 0);

  return (
    <>
      <div className="shade" onClick={close} />
      <aside className="drawer">
        <div className="drawer-head">
          <div>
            <Pill>Your order</Pill>
            <h2>Tomorrow's delivery</h2>
          </div>
          <button className="round" onClick={close}><X /></button>
        </div>

        {!cartItems.length ? (
          <div className="empty">
            <ShoppingCart size={42} />
            <h3>Your cart is empty</h3>
            <p>Add boxes from today's market to build an order.</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item) => {
                const fruit = item.fruit;
                const shade = getFruitShade(fruit.FruitName);
                const subtotal = item.quantity * Number(fruit.Price);
                return (
                  <div className="cart-item" key={fruit.FruitID}>
                    <span className={`cart-item-image-container ${shade}`}>
                      <img src={fruitImages[shade]} alt={fruit.FruitName} className="cart-item-image" />
                    </span>
                    <div style={{ flex: 1 }}>
                      <b>{fruit.FruitName}</b>
                      <small style={{ display: "block", color: "var(--muted)" }}>{fruit.PackageType} • {money.format(Number(fruit.Price))}/box</small>
                      <div className="cart-item-qty-row">
                        <QuantityStepper 
                          quantity={item.quantity} 
                          onIncrease={() => onUpdateQuantity(fruit, 1)} 
                          onDecrease={() => onUpdateQuantity(fruit, -1)} 
                          max={Number(fruit.AvailableQuantity)} 
                        />
                        <button className="text" style={{ color: "#b24a32", fontSize: "12px", padding: "2px 6px" }} onClick={() => onRemoveItem(fruit.FruitID)}>
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-subtotal">
                      <strong style={{ fontSize: "14px", color: "var(--green)" }}>{money.format(subtotal)}</strong>
                      <small>{item.quantity} box(es)</small>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="total">
              <p><span>Total Boxes</span><b>{totalBoxes} box{totalBoxes !== 1 ? "es" : ""}</b></p>
              <p><span>Delivery</span><b>COD</b></p>
              <h3><span>Total Amount</span>{money.format(totalMoney)}</h3>
              <button className="primary" onClick={() => user?.role === "Retailer" ? checkout() : onLogin()}>
                {user?.role === "Retailer" ? `Place COD order (${totalBoxes} boxes)` : "Login to place order"} <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Login({ close, request, onSuccess, notice }) {
  const [mode, setMode] = useState("retailer");
  const [isSignUp, setIsSignUp] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  const [retailerName, setRetailerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  
  const [resetKey, setResetKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    setBusy(true);
    try {
      if (forgotPassword && mode === "admin") {
        await request("/reset-admin-password", {
          method: "PUT",
          body: JSON.stringify({ adminUsername: username.trim(), resetKey, newPassword })
        });
        notice("Admin password reset successfully. Please log in.");
        setForgotPassword(false);
        setPassword("");
        setNewPassword("");
        setResetKey("");
      } else if (mode === "retailer" && isSignUp) {
        if (!/^\d{10}$/.test(mobileNumber.trim())) throw new Error("Mobile number must contain exactly 10 digits.");
        if (!retailerName.trim() || !shopName.trim() || !address.trim() || !password.trim()) throw new Error("All fields including password are required.");
        
        await request("/retailers", {
          method: "POST",
          body: JSON.stringify({
            mobileNumber: mobileNumber.trim(),
            retailerName: retailerName.trim(),
            shopName: shopName.trim(),
            address: address.trim(),
            password: password.trim()
          }),
        });

        const response = await request("/login", {
          method: "POST",
          body: JSON.stringify({ mobileNumber: mobileNumber.trim(), password }),
        });
        onSuccess(response.user);
        close();
        notice(`Registered & logged in as ${response.user.retailerName || "Retailer"}!`);
      } else {
        const body = mode === "retailer" ? { mobileNumber, password } : { username, password };
        const response = await request("/login", { method: "POST", body: JSON.stringify(body) });
        onSuccess(response.user);
        close();
        notice(`Welcome${response.user.retailerName ? `, ${response.user.retailerName}` : ""}.`);
      }
    } catch (error) {
      notice(error.message, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="shade" onClick={close} />
      <div className="login-modal">
        <button className="round close" onClick={close}><X /></button>
        <Brand />
        <div className="login-tabs">
          <button className={mode === "retailer" ? "on" : ""} onClick={() => { setMode("retailer"); setForgotPassword(false); setIsSignUp(false); }}>Retailer</button>
          <button className={mode === "admin" ? "on" : ""} onClick={() => { setMode("admin"); setForgotPassword(false); setIsSignUp(false); }}>Wholesaler</button>
        </div>
        
        {forgotPassword ? (
          mode === "retailer" ? (
             <>
               <Pill tone="lime"><CircleCheck size={14} /> Forgot Password</Pill>
               <h2>Need a password reset?</h2>
               <p>Please contact your Wholesale Administrator to reset your password. They can issue a new password from their Admin Dashboard.</p>
               <button className="outline" onClick={() => setForgotPassword(false)} style={{marginTop: "15px"}}>Back to Login</button>
             </>
          ) : (
             <>
               <Pill tone="lime"><CircleCheck size={14} /> Reset Admin Password</Pill>
               <h2>Recover your account</h2>
               <p>Enter the ADMIN_RESET_KEY from your server environment to set a new password.</p>
               <label>Admin Username<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" /></label>
               <label>Admin Reset Key<input type="password" value={resetKey} onChange={(e) => setResetKey(e.target.value)} placeholder="Secret Key" /></label>
               <label>New Password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" /></label>
               <button disabled={busy || !username || !resetKey || !newPassword} className="primary" onClick={verify}>Reset Password <ArrowRight size={18} /></button>
               <button className="text" style={{marginTop: "10px", width: "100%"}} onClick={() => setForgotPassword(false)}>Back to Login</button>
             </>
          )
        ) : mode === "retailer" ? (
          <>
            <div style={{ display: "flex", gap: "15px", marginBottom: "16px", fontSize: "13px" }}>
              <button 
                type="button"
                style={{ background: "none", color: !isSignUp ? "var(--green)" : "#637168", fontWeight: !isSignUp ? "700" : "500", padding: "4px 0", borderBottom: !isSignUp ? "2px solid var(--green)" : "2px solid transparent", cursor: "pointer" }}
                onClick={() => { setIsSignUp(false); }}
              >
                Log In
              </button>
              <button 
                type="button"
                style={{ background: "none", color: isSignUp ? "var(--green)" : "#637168", fontWeight: isSignUp ? "700" : "500", padding: "4px 0", borderBottom: isSignUp ? "2px solid var(--green)" : "2px solid transparent", cursor: "pointer" }}
                onClick={() => { setIsSignUp(true); }}
              >
                Sign Up (New Shop)
              </button>
            </div>

            {!isSignUp ? (
              <>
                <Pill tone="lime"><CircleCheck size={14} /> B2B buyer login</Pill>
                <h2>Let's get your shop supplied.</h2>
                <label>Mobile number
                  <input value={mobileNumber} maxLength="10" onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, ""))} placeholder="e.g. 9876543210" />
                </label>
                <label>Password
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your Password" />
                </label>
                <button 
                  disabled={busy || !mobileNumber || !password} 
                  className="primary" 
                  onClick={verify}
                >
                  Log In <ArrowRight size={18} />
                </button>
                <button className="text" style={{marginTop: "10px", width: "100%"}} onClick={() => setForgotPassword(true)}>Forgot Password?</button>
              </>
            ) : (
              <>
                <Pill tone="lime"><Store size={14} /> Register new shop</Pill>
                <h2>Create buyer account.</h2>
                
                <label>Mobile number
                  <input value={mobileNumber} maxLength="10" onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, ""))} placeholder="e.g. 9876543210" />
                </label>
                <label>Retailer name
                  <input value={retailerName} onChange={(event) => setRetailerName(event.target.value)} placeholder="Owner's Full Name" />
                </label>
                <label>Shop name
                  <input value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="e.g. Metro Fruit Stall" />
                </label>
                <label>Address
                  <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Shop Street Address" />
                </label>
                <label>Password
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Choose a secure password" />
                </label>
                
                <button 
                  disabled={busy || !mobileNumber || !retailerName || !shopName || !address || !password} 
                  className="primary" 
                  onClick={verify}
                >
                  Register & Login <ArrowRight size={18} />
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <Pill tone="lime"><Store size={14} /> Warehouse login</Pill>
            <h2>Manage your inventory.</h2>
            <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="admin" /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" /></label>
            <button disabled={busy || !username || !password} className="primary" onClick={verify}>Login <ArrowRight size={18} /></button>
            <button className="text" style={{marginTop: "10px", width: "100%"}} onClick={() => setForgotPassword(true)}>Forgot Password?</button>
          </>
        )}
      </div>
    </>
  );
}

function App() {
  const [page, setPage] = useState("market");
  const [fruits, setFruits] = useState(fallbackFruits);
  const [banners, setBanners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Cart state stored as array of items: [{ fruit, quantity }]
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("fruitlane_cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Support legacy array of fruits format migration
      if (parsed.length > 0 && parsed[0].FruitID && !parsed[0].fruit) {
        const map = {};
        parsed.forEach(f => {
          if (!map[f.FruitID]) map[f.FruitID] = { fruit: f, quantity: 0 };
          map[f.FruitID].quantity += 1;
        });
        return Object.values(map);
      }
      return parsed;
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("fruitlane_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [noticeState, setNoticeState] = useState(null);

  // Real-time notification & Socket state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastEvents, setToastEvents] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("fruitlane_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("fruitlane_user");
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem("fruitlane_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const notice = (message, error = false) => { setNoticeState({ message, error }); window.setTimeout(() => setNoticeState(null), 4500); };
  
  const request = async (path, options = {}) => {
    const response = await fetch(`${apiUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    if (response.status === 204) return null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed.");
      return data;
    }
    throw new Error(response.ok ? "Server response was not JSON." : `API unreachable (${response.status})`);
  };

  const loadFruits = async () => { 
    setLoading(true); 
    try { 
      setFruits(await request("/fruits")); 
    } catch (error) { 
      // Silently handle fallback
    } finally { 
      setLoading(false); 
    } 
  };

  const loadBanners = async () => {
    try {
      const data = await request("/banners");
      setBanners(data || []);
    } catch (error) {
      // Silently handle
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      let query = "/orders";
      if (user?.role === "Retailer" && user?.mobileNumber) {
        query += `?retailerMobile=${user.mobileNumber}`;
      }
      const data = await request(query);
      setOrders(data);
    } catch (error) {
      // Silently handle
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      let query = `/notifications?role=${user.role}`;
      if (user.role === "Retailer" && user.mobileNumber) {
        query += `&retailerMobile=${user.mobileNumber}`;
      }
      const data = await request(query);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      // Ignore initial notification error if offline
    }
  };

  // Socket.IO Setup & Event Subscriptions
  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket.IO connected to server");
      if (user) {
        socket.emit("join", { role: user.role, retailerMobile: user.mobileNumber });
      }
    });

    socket.on("new_notification", (notif) => {
      console.log("Real-time notification received:", notif);
      setToastEvents((prev) => [...prev, notif]);
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((count) => count + 1);
    });

    socket.on("order_updated", (updatedOrder) => {
      console.log("Real-time order update received:", updatedOrder);
      setOrders((prevOrders) => {
        const index = prevOrders.findIndex(o => o.OrderID === updatedOrder.OrderID);
        if (index >= 0) {
          const newOrders = [...prevOrders];
          newOrders[index] = updatedOrder;
          return newOrders;
        } else {
          return [updatedOrder, ...prevOrders];
        }
      });

      setSelectedOrder((prevSelected) => {
        if (prevSelected && prevSelected.OrderID === updatedOrder.OrderID) {
          return updatedOrder;
        }
        return prevSelected;
      });

      loadFruits();
    });

    socket.on("fruit_reordered", () => {
      loadFruits();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && user) {
      socketRef.current.emit("join", { role: user.role, retailerMobile: user.mobileNumber });
    }
    fetchNotifications();
    loadOrders();
  }, [user]);

  useEffect(() => {
    loadFruits();
    loadBanners();
  }, []);

  // Cart Helper functions
  const getCartQuantity = (fruitId) => {
    const item = cart.find(i => i.fruit.FruitID === fruitId);
    return item ? item.quantity : 0;
  };

  const updateCartQuantity = (fruit, delta) => {
    setCart((prevCart) => {
      const index = prevCart.findIndex(i => i.fruit.FruitID === fruit.FruitID);
      const stock = Number(fruit.AvailableQuantity);

      if (index >= 0) {
        const currentQty = prevCart[index].quantity;
        const newQty = currentQty + delta;
        if (newQty <= 0) {
          return prevCart.filter(i => i.fruit.FruitID !== fruit.FruitID);
        } else {
          const updated = [...prevCart];
          updated[index] = { ...updated[index], quantity: Math.min(newQty, stock) };
          return updated;
        }
      } else if (delta > 0) {
        return [...prevCart, { fruit, quantity: Math.min(delta, stock) }];
      }
      return prevCart;
    });
  };

  const removeCartItem = (fruitId) => {
    setCart((prevCart) => prevCart.filter(i => i.fruit.FruitID !== fruitId));
  };

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    try {
      for (const { fruit, quantity } of cart) {
        await request("/orders", { 
          method: "POST", 
          body: JSON.stringify({ retailerMobile: user.mobileNumber, fruitId: fruit.FruitID, quantity }) 
        });
      }
      setCart([]);
      try { localStorage.removeItem("fruitlane_cart"); } catch {}
      setCartOpen(false);
      notice(`COD order placed for ${cartTotalCount} box(es). Notifications sent to wholesaler.`);
      loadFruits();
      loadOrders();
    } catch (error) {
      notice(error.message, true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setNotifications([]);
    setUnreadCount(0);
    try {
      localStorage.removeItem("fruitlane_user");
      localStorage.removeItem("fruitlane_cart");
    } catch {}
    setPage("market");
    notice("You have been logged out.");
  };

  const openAdmin = () => { if (user?.role === "Admin") setPage("admin"); else setLoginOpen(true); };

  const handleMarkRead = async (id) => {
    try {
      await request(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await request("/notifications/read-all", {
        method: "PATCH",
        body: JSON.stringify({ role: user?.role, retailerMobile: user?.mobileNumber })
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectOrder = async (orderId) => {
    try {
      const order = await request(`/orders/${orderId}`);
      setSelectedOrder(order);
      if (user?.role === "Admin") {
        setPage("delivery");
      } else if (user?.role === "Retailer") {
        setPage("my-orders");
      }
    } catch (err) {
      notice("Order details could not be retrieved.", true);
    }
  };

  const handleUpdateOrderStatus = async (order, targetStatus) => {
    try {
      const updated = await request(`/orders/${order.OrderID}`, {
        method: "PUT",
        body: JSON.stringify({ status: targetStatus })
      });
      notice(`Order #${order.OrderID} marked as ${targetStatus}.`);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      notice(err.message, true);
    }
  };

  return (
    <>
      <ToastContainer toastEvents={toastEvents} onToastClick={handleSelectOrder} />

      <Header 
        page={page} 
        setPage={setPage} 
        cartTotalCount={cartTotalCount} 
        user={user} 
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onSelectOrder={handleSelectOrder}
        onCart={() => setCartOpen(true)} 
        onLogin={() => setLoginOpen(true)} 
        onLogout={handleLogout} 
        onAdmin={openAdmin} 
      />

      {page === "market" && (
        <Market 
          fruits={fruits} 
          loading={loading} 
          banners={banners}
          getCartQuantity={getCartQuantity}
          onUpdateQuantity={updateCartQuantity} 
        />
      )}
      {page === "admin" && user?.role === "Admin" && (
        <Admin 
          user={user} 
          fruits={fruits} 
          setFruits={setFruits}
          loading={loading} 
          banners={banners}
          refreshBanners={loadBanners}
          request={request} 
          refresh={loadFruits} 
          notice={notice} 
        />
      )}
      {page === "delivery" && user?.role === "Admin" && (
        <Orders 
          request={request} 
          notice={notice} 
          orders={orders} 
          loadOrders={loadOrders} 
          loading={ordersLoading} 
          onSelectOrder={handleSelectOrder} 
          onUpdateStatus={handleUpdateOrderStatus} 
        />
      )}
      {page === "my-orders" && user?.role === "Retailer" && (
        <RetailerOrders 
          user={user} 
          request={request} 
          notice={notice} 
          orders={orders} 
          loadOrders={loadOrders} 
          loading={ordersLoading} 
          onSelectOrder={handleSelectOrder} 
        />
      )}

      <footer>
        <Brand />
        <span>Fresh produce, fairly traded.</span>
        <span>2026 FruitLane Marketplace</span>
      </footer>

      {cartOpen && (
        <Cart 
          cartItems={cart} 
          onUpdateQuantity={updateCartQuantity} 
          onRemoveItem={removeCartItem} 
          close={() => setCartOpen(false)} 
          checkout={checkout} 
          user={user} 
          onLogin={() => { setCartOpen(false); setLoginOpen(true); }} 
        />
      )}
      {loginOpen && <Login close={() => setLoginOpen(false)} request={request} onSuccess={(nextUser) => { setUser(nextUser); if (nextUser.role === "Admin") setPage("admin"); }} notice={notice} />}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          user={user} 
          onClose={() => setSelectedOrder(null)} 
          onUpdateStatus={handleUpdateOrderStatus} 
        />
      )}
      {noticeState && <div className={`toast ${noticeState.error ? "error" : ""}`}>{noticeState.message}</div>}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
