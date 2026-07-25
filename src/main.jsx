import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Bell, Box, CalendarDays, Check, ChevronDown, CircleCheck, Clock3, LayoutDashboard, MapPin, Menu, Package, PackageCheck, Plus, Search, ShoppingCart, Sparkles, Store, Trash2, Truck, Users, X } from "lucide-react";
import "./styles.css";
import "./connected.css";

import appleImg from "./assets/apple.png";
import bananaImg from "./assets/banana.png";
import mangoImg from "./assets/mango.png";
import orangeImg from "./assets/orange.png";
import grapeImg from "./assets/grape.png";
import melonImg from "./assets/melon.png";

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

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const fallbackFruits = [
  { FruitID: "FR001", FruitName: "Kashmiri Gala Apples", PackageType: "20 KG Box", AvailableQuantity: 70, Price: 2180, CreatedDate: "2026-07-01" },
  { FruitID: "FR002", FruitName: "Yelakki Golden Banana", PackageType: "18 KG Crate", AvailableQuantity: 90, Price: 920, CreatedDate: "2026-07-01" },
  { FruitID: "FR003", FruitName: "Alphonso Mangoes", PackageType: "6 Dozen Carton", AvailableQuantity: 45, Price: 3650, CreatedDate: "2026-07-01" },
];
const blankFruit = { fruitName: "", packageType: "", availableQuantity: "", price: "" };

function Pill({ children, tone = "soft" }) { return <span className={`pill ${tone}`}>{children}</span>; }
function Brand() { return <div className="brand"><i>F</i><b>Fruit<span>Lane</span></b></div>; }
function Stat({ icon, top, bottom }) { return <div className="stat"><span>{icon}</span><p><b>{top}</b><small>{bottom}</small></p></div>; }

function Header({ page, setPage, cart, user, onCart, onLogin, onLogout, onAdmin }) {
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
      <button className="round bell"><Bell size={19} /><small>3</small></button>
      <button className="cart" onClick={onCart}><ShoppingCart size={18} /><span>Cart</span>{cart.length > 0 && <b>{cart.length}</b>}</button>
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

function Product({ fruit, add }) {
  const shade = getFruitShade(fruit.FruitName);
  const stock = Number(fruit.AvailableQuantity);
  return <article className="product"><div className={`product-art ${shade}`}><Pill tone="white">{stock > 10 ? "In stock" : "Low stock"}</Pill><img src={fruitImages[shade]} alt={fruit.FruitName} className="product-image" /></div>
    <div className="product-body"><div className="name"><h3>{fruit.FruitName}</h3><small>{stock} boxes left</small></div>
      <p className="origin"><Box size={14} />{fruit.PackageType}</p>
      <div className="price"><strong>{money.format(Number(fruit.Price))}</strong><span>/ box</span></div>
      <div className="product-bottom"><Pill>{fruit.FruitID}</Pill><span>Available: <b>{stock}</b></span><button disabled={!stock} onClick={() => add(fruit)}><Plus size={16} /> Add</button></div>
    </div>
  </article>;
}

function Market({ fruits, loading, add }) {
  const [search, setSearch] = useState("");
  const list = useMemo(() => fruits.filter((fruit) => `${fruit.FruitName} ${fruit.PackageType}`.toLowerCase().includes(search.toLowerCase())), [fruits, search]);
  return <main>
    <section className="hero"><div className="hero-text"><Pill tone="lime"><Sparkles size={14} /> B2B fresh market</Pill><h1>Fresh stock.<br /><em>Fair wholesale prices.</em></h1><p>Daily-market fruit for your shop, restaurant or juice bar - delivered before your day gets busy.</p><div className="hero-facts"><span><Clock3 size={16} /> Order by <b>10:00 PM</b></span><span><Truck size={16} /> Next-day delivery</span></div><button className="primary" onClick={() => document.querySelector("#catalog")?.scrollIntoView({ behavior: "smooth" })}>View today's market <ArrowRight size={18} /></button></div><div className="hero-art"><div className="sun" /><span className="a1">A</span><span className="a2">M</span><span className="a3">B</span><div className="crate"><strong>FRESH<br />MARKET</strong><b>F</b><b>R</b><b>U</b></div></div></section>
    <section className="quick-stats"><Stat icon={<CalendarDays />} top="Live inventory" bottom="From the Fruits sheet" /><Stat icon={<Box />} top={`${fruits.length} fruit lots`} bottom="Updated by wholesaler" /><Stat icon={<Truck />} top="COD available" bottom="Pay on delivery" /></section>
    <section className="catalog" id="catalog"><div className="section-title"><div><Pill>Today's wholesale catalog</Pill><h2>Buy by the crate, <em>save on every order.</em></h2></div></div><div className="tools"><label><Search size={20} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fruit or package type" /></label><span><i /> {loading ? "Refreshing inventory..." : "Live inventory from warehouse"}</span></div><div className="product-grid">{list.map((fruit) => <Product key={fruit.FruitID} fruit={fruit} add={add} />)}</div>{!loading && list.length === 0 && <div className="no-results">No matching fresh lots today.</div>}</section>
  </main>;
}

function FruitForm({ form, setForm, onSubmit, editing, onCancel, busy }) {
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return <form className="fruit-form" onSubmit={onSubmit}>
    <label>Fruit name<input required name="fruitName" value={form.fruitName} onChange={update} placeholder="e.g. Kinnaur Apples" /></label>
    <label>Package type<input required name="packageType" value={form.packageType} onChange={update} placeholder="e.g. 20 KG Box" /></label>
    <label>Available boxes<input required min="0" type="number" name="availableQuantity" value={form.availableQuantity} onChange={update} /></label>
    <label>Price per box<input required min="0" type="number" name="price" value={form.price} onChange={update} /></label>
    <div className="form-actions"><button disabled={busy} className="primary">{editing ? "Save changes" : "Add fruit"} <ArrowRight size={16} /></button>{editing && <button type="button" className="outline" onClick={onCancel}>Cancel</button>}</div>
  </form>;
}

function Admin({ user, fruits, loading, request, refresh, notice }) {
  const [form, setForm] = useState(blankFruit);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [retailer, setRetailer] = useState({ mobileNumber: "", retailerName: "", shopName: "", address: "", password: "" });
  const [retailerBusy, setRetailerBusy] = useState(false);
  const [resetData, setResetData] = useState({ targetMobileNumber: "", newPassword: "", adminPassword: "" });
  const [resetBusy, setResetBusy] = useState(false);

  const edit = (fruit) => { setEditing(fruit); setForm({ fruitName: fruit.FruitName, packageType: fruit.PackageType, availableQuantity: fruit.AvailableQuantity, price: fruit.Price }); };
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

  const boxCount = fruits.reduce((total, fruit) => total + Number(fruit.AvailableQuantity || 0), 0);
  return <main className="page"><div className="page-head"><div><Pill>Admin workspace</Pill><h1>Manage the <em>live fruit catalog.</em></h1><p>Every change is saved in the database and appears to retailers on refresh.</p></div></div>
    <div className="metrics"><Metric icon={<Package />} label="Fruit lots" value={fruits.length} note="Active in catalog" /><Metric icon={<Box />} label="Available boxes" value={boxCount} note="Across all fruits" /><Metric icon={<Users />} label="Retailers" value="Live" note="Stored in database" /><Metric icon={<PackageCheck />} label="Source" value="DB" note="Shared inventory" /></div>
    <div className="manage-grid"><section className="panel"><PanelTitle title={editing ? `Editing ${editing.FruitID}` : "Add a new fruit"} sub="Required fields become a new database record" /><FruitForm form={form} setForm={setForm} onSubmit={save} editing={editing} onCancel={reset} busy={busy} /></section>
      <section className="panel"><PanelTitle title="Live inventory" sub={loading ? "Refreshing..." : `${fruits.length} items in DB`} /><div className="manage-table"><div className="manage-head"><span>Fruit</span><span>Package</span><span>Stock</span><span>Price</span><span>Actions</span></div>{fruits.map((fruit) => <div className="manage-row" key={fruit.FruitID}><b>{fruit.FruitName}<small>{fruit.FruitID}</small></b><span>{fruit.PackageType}</span><span>{fruit.AvailableQuantity}</span><span>{money.format(Number(fruit.Price))}</span><span><button className="text" onClick={() => edit(fruit)}>Edit</button><button className="danger" onClick={() => remove(fruit)}><Trash2 size={15} /></button></span></div>)}</div></section></div>
    
    <div className="manage-grid">
      <section className="panel retailer-registration"><PanelTitle title="Register a retailer" sub="Creates a new account" /><form className="fruit-form retailer-form" onSubmit={registerRetailer}><label>Mobile number<input required pattern="[0-9]{10}" maxLength="10" value={retailer.mobileNumber} onChange={(event) => setRetailer({ ...retailer, mobileNumber: event.target.value.replace(/\D/g, "") })} placeholder="10-digit mobile number" /></label><label>Retailer name<input required value={retailer.retailerName} onChange={(event) => setRetailer({ ...retailer, retailerName: event.target.value })} placeholder="Owner name" /></label><label>Shop name<input required value={retailer.shopName} onChange={(event) => setRetailer({ ...retailer, shopName: event.target.value })} placeholder="Shop name" /></label><label>Address<input required value={retailer.address} onChange={(event) => setRetailer({ ...retailer, address: event.target.value })} placeholder="Business address" /></label><label>Password<input required type="password" value={retailer.password} onChange={(event) => setRetailer({ ...retailer, password: event.target.value })} placeholder="Initial Password" /></label><div className="form-actions"><button disabled={retailerBusy} className="primary">Register retailer <Users size={16} /></button></div></form></section>
      
      <section className="panel retailer-registration"><PanelTitle title="Reset Retailer Password" sub="Assign a new password to a retailer" /><form className="fruit-form retailer-form" onSubmit={resetUserPassword}><label>Retailer Mobile Number<input required pattern="[0-9]{10}" maxLength="10" value={resetData.targetMobileNumber} onChange={(event) => setResetData({ ...resetData, targetMobileNumber: event.target.value.replace(/\D/g, "") })} placeholder="10-digit mobile number" /></label><label>New Password<input required type="password" value={resetData.newPassword} onChange={(event) => setResetData({ ...resetData, newPassword: event.target.value })} placeholder="New Password" /></label><label>Confirm Admin Password<input required type="password" value={resetData.adminPassword} onChange={(event) => setResetData({ ...resetData, adminPassword: event.target.value })} placeholder="Your Admin Password" /></label><div className="form-actions"><button disabled={resetBusy} className="primary">Reset Password</button></div></form></section>
    </div>
  </main>;
}

function Metric({ icon, label, value, note }) { return <article className="metric"><span>{icon}</span><p>{label}</p><h2>{value}</h2><small>{note}</small></article>; }
function PanelTitle({ title, sub }) { return <div className="panel-title"><div><h2>{title}</h2><p>{sub}</p></div></div>; }

function Orders({ request, notice }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { setOrders(await request("/orders")); } catch (error) { notice(error.message, true); } finally { setLoading(false); } };
  useEffect(() => {
    load();
    const interval = setInterval(async () => {
      try {
        const data = await request("/orders");
        setOrders(data);
      } catch (error) {
        // Fail silently in background
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const nextStatus = async (order) => { const next = order.Status === "Pending" ? "Approved" : order.Status === "Approved" ? "Delivered" : "Delivered"; try { await request(`/orders/${order.OrderID}`, { method: "PUT", body: JSON.stringify({ status: next }) }); notice(`Order ${order.OrderID} marked ${next}.`); load(); } catch (error) { notice(error.message, true); } };
  return <main className="page"><div className="page-head"><div><Pill>Order management</Pill><h1>Every crate, <em>right on time.</em></h1><p>Approve and deliver orders from the shared Orders sheet.</p></div></div><section className="panel"><PanelTitle title="Orders" sub={loading ? "Loading orders..." : `${orders.length} orders`} />{orders.map((order) => <div className="order-row order-live" key={order.OrderID}><span className="avatar">{order.RetailerName?.[0] || "R"}</span><p><b>{order.RetailerName}</b><small>{order.OrderID} - {order.FruitName} x {order.Quantity}</small></p><strong>{money.format(Number(order.Total))}</strong><Pill tone={order.Status === "Delivered" ? "lime" : "soft"}>{order.Status}</Pill>{order.Status !== "Delivered" && order.Status !== "Cancelled" && <button className="text" onClick={() => nextStatus(order)}>Next <ChevronDown size={14} /></button>}</div>)}{!loading && !orders.length && <div className="no-results">No orders have been placed yet.</div>}</section></main>;
}

function RetailerOrders({ user, request, notice }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await request(`/orders?retailerMobile=${user.mobileNumber}`);
      setOrders(data);
    } catch (error) {
      notice(error.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(async () => {
      try {
        const data = await request(`/orders?retailerMobile=${user.mobileNumber}`);
        setOrders(data);
      } catch (error) {
        // Fail silently in background
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user.mobileNumber]);

  const totalOrderedBoxes = orders.reduce((sum, o) => sum + (Number(o.Quantity) || 0), 0);
  const totalDeliveredBoxes = orders.filter(o => o.Status === "Delivered").reduce((sum, o) => sum + (Number(o.Quantity) || 0), 0);
  
  const totalOrderedValue = orders.reduce((sum, o) => sum + (Number(o.Total) || 0), 0);
  const totalDeliveredValue = orders.filter(o => o.Status === "Delivered").reduce((sum, o) => sum + (Number(o.Total) || 0), 0);
  const pendingValue = orders.filter(o => o.Status !== "Delivered" && o.Status !== "Cancelled").reduce((sum, o) => sum + (Number(o.Total) || 0), 0);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <Pill>Retailer Panel</Pill>
          <h1>Track your <em>orders.</em></h1>
          <p>Live updates of your wholesale purchases from the warehouse.</p>
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
            <div key={order.OrderID} className="order-row" style={{ gridTemplateColumns: "auto 1.5fr 1fr auto" }}>
              <span className="avatar" style={{ background: order.Status === "Delivered" ? "#e0f2df" : "#fff0d7", color: order.Status === "Delivered" ? "#287d4a" : "#cd7b19" }}>
                {order.FruitName?.[0] || "F"}
              </span>
              <div>
                <b style={{ fontSize: "14px", color: "var(--ink)" }}>{order.FruitName}</b>
                <small style={{ display: "block", color: "var(--muted)", fontSize: "11px", marginTop: "2px" }}>
                  Order ID: {order.OrderID} • Date: {new Date(order.OrderDate).toLocaleDateString()}
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
                <Pill tone={order.Status === "Delivered" ? "lime" : order.Status === "Cancelled" ? "danger" : "soft"}>
                  {order.Status}
                </Pill>
              </div>
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

function Cart({ items, remove, close, checkout, user, onLogin }) {
  const total = items.reduce((sum, fruit) => sum + Number(fruit.Price), 0);
  return <><div className="shade" onClick={close} /><aside className="drawer"><div className="drawer-head"><div><Pill>Your order</Pill><h2>Tomorrow's delivery</h2></div><button className="round" onClick={close}><X /></button></div>{!items.length ? <div className="empty"><ShoppingCart size={42} /><h3>Your cart is empty</h3><p>Add boxes from today's market to build an order.</p></div> : <><div className="cart-items">{items.map((fruit, index) => {
    const shade = getFruitShade(fruit.FruitName);
    return <div className="cart-item" key={`${fruit.FruitID}-${index}`}><span className={`cart-item-image-container ${shade}`}><img src={fruitImages[shade]} alt="" className="cart-item-image" /></span><p><b>{fruit.FruitName}</b><small>{fruit.PackageType}</small><button onClick={() => remove(index)}>Remove</button></p><strong>{money.format(Number(fruit.Price))}</strong></div>;
  })}</div><div className="total"><p><span>Subtotal</span><b>{money.format(total)}</b></p><p><span>Delivery</span><b>COD</b></p><h3><span>Total</span>{money.format(total)}</h3><button className="primary" onClick={() => user?.role === "Retailer" ? checkout() : onLogin()}> {user?.role === "Retailer" ? "Place COD order" : "Login to place order"} <ArrowRight size={18} /></button><small>Retailer OTP for this demo: 123456</small></div></>}</aside></>;
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
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noticeState, setNoticeState] = useState(null);
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
    throw new Error(response.ok ? "Server response was not JSON." : `API unreachable (${response.status}): Node.js backend is not active on Hostinger.`);
  };
  const loadFruits = async () => { setLoading(true); try { setFruits(await request("/fruits")); } catch (error) { notice("Backend not connected yet: showing sample fruits.", true); } finally { setLoading(false); } };
  const pollFruits = async () => {
    try {
      const data = await request("/fruits");
      setFruits(data);
    } catch (error) {
      // Fail silently in background
    }
  };
  useEffect(() => {
    loadFruits();
    const interval = setInterval(pollFruits, 5000);
    return () => clearInterval(interval);
  }, []);
  const add = (fruit) => { setCart([...cart, fruit]); setCartOpen(true); };
  const checkout = async () => { const grouped = Object.values(cart.reduce((all, fruit) => { all[fruit.FruitID] = all[fruit.FruitID] || { fruit, quantity: 0 }; all[fruit.FruitID].quantity += 1; return all; }, {})); try { await Promise.all(grouped.map(({ fruit, quantity }) => request("/orders", { method: "POST", body: JSON.stringify({ retailerMobile: user.mobileNumber, fruitId: fruit.FruitID, quantity }) }))); setCart([]); setCartOpen(false); notice("COD order placed. The wholesaler can now approve it."); loadFruits(); } catch (error) { notice(error.message, true); } };
  const openAdmin = () => { if (user?.role === "Admin") setPage("admin"); else setLoginOpen(true); };
  return <><Header page={page} setPage={setPage} cart={cart} user={user} onCart={() => setCartOpen(true)} onLogin={() => setLoginOpen(true)} onLogout={() => { setUser(null); setPage("market"); notice("You have been logged out."); }} onAdmin={openAdmin} />{page === "market" && <Market fruits={fruits} loading={loading} add={add} />}{page === "admin" && user?.role === "Admin" && <Admin user={user} fruits={fruits} loading={loading} request={request} refresh={loadFruits} notice={notice} />}{page === "delivery" && user?.role === "Admin" && <Orders request={request} notice={notice} />}{page === "my-orders" && user?.role === "Retailer" && <RetailerOrders user={user} request={request} notice={notice} />}<footer><Brand /><span>Fresh produce, fairly traded.</span><span>2026 FruitLane</span></footer>{cartOpen && <Cart items={cart} remove={(index) => setCart(cart.filter((_, itemIndex) => itemIndex !== index))} close={() => setCartOpen(false)} checkout={checkout} user={user} onLogin={() => { setCartOpen(false); setLoginOpen(true); }} />}{loginOpen && <Login close={() => setLoginOpen(false)} request={request} onSuccess={(nextUser) => { setUser(nextUser); if (nextUser.role === "Admin") setPage("admin"); }} notice={notice} />}{noticeState && <div className={`toast ${noticeState.error ? "error" : ""}`}>{noticeState.message}</div>}</>;
}

createRoot(document.getElementById("root")).render(<App />);
