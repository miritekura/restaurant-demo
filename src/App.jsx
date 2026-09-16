import { useState } from "react";
import { dishes, deliveryInfo } from "./data";
import Menu from "./components/Menu";
import Cart from "./components/Cart";
import PaymentModal from "./components/PaymentModal";
import FatSecretSyncModal from "./components/FatSecretSyncModal";
import * as fatsecretService from "./fatsecretService";
import "./App.css";

export default function App() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showPayment, setShowPayment] = useState(false);
  const [showFatSecretSync, setShowFatSecretSync] = useState(false);
  const [fatsecretLinked, setFatsecretLinked] = useState(() => fatsecretService.isLinked());

  function addToCart(dish) {
    const existing = cart.find((item) => item.id === dish.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...dish, quantity: 1 }]);
    }
  }

  function removeFromCart(id) {
    setCart(cart.filter((item) => item.id !== id));
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app">
      <header className="app-header">
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <img src={`${import.meta.env.BASE_URL}deliveroo-logo.png`} alt="Deliveroo" height="36" />
          <h1>roo<span style={{color:"#1a271f"}}>food</span></h1>
          <span className="delivery-eta">
            <span className="eta-dot" />
            <span className="eta-icon">🛵</span>
            Delivery in {deliveryInfo.etaMin}–{deliveryInfo.etaMax} min
          </span>
          {fatsecretLinked && (
            <div className="fatsecret-badge">
              <span className="fatsecret-badge-dot" />
              FatSecret connected
              <button
                className="fatsecret-disconnect-btn"
                onClick={() => {
                  fatsecretService.disconnect();
                  setFatsecretLinked(false);
                  console.log("fatsecret_account_unlinked", {
                    user_id: fatsecretService.MOCK_USER_ID,
                    timestamp: new Date().toISOString(),
                  });
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        <div className="cart-badge-wrapper">
          <span className="cart-icon">🛒</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>
      </header>

      <main className="app-main">
        <Menu
          dishes={dishes}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onAddToCart={addToCart}
        />
        <Cart cart={cart} onRemove={removeFromCart} onCheckout={() => setShowFatSecretSync(true)} />
      </main>
      {showFatSecretSync && (
        <FatSecretSyncModal
          cart={cart}
          onSkip={() => { setShowFatSecretSync(false); setShowPayment(true); }}
          onProceed={() => {
            setFatsecretLinked(fatsecretService.isLinked());
            setShowFatSecretSync(false);
            setShowPayment(true);
          }}
        />
      )}
      {showPayment && (
        <PaymentModal
          cart={cart}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setCart([]); setShowPayment(false); }}
        />
      )}
    </div>
  );
}
