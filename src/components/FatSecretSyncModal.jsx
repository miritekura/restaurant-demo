import { useState, useEffect } from "react";
import * as fatsecretService from "../fatsecretService";

function ManualMacroForm({ dish, onSave }) {
  const [form, setForm] = useState({ kcal: "", protein: "", carbs: "", fat: "" });

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value.replace(/\D/g, "") }));
  }

  const canSave = form.protein !== "" && form.carbs !== "" && form.fat !== "";

  return (
    <div className="manual-macro-form">
      <input
        className="macro-input"
        type="text"
        inputMode="numeric"
        placeholder="kcal"
        value={form.kcal}
        onChange={(e) => handleChange("kcal", e.target.value)}
      />
      <input
        className="macro-input"
        type="text"
        inputMode="numeric"
        placeholder="protein (g)"
        value={form.protein}
        onChange={(e) => handleChange("protein", e.target.value)}
      />
      <input
        className="macro-input"
        type="text"
        inputMode="numeric"
        placeholder="carbs (g)"
        value={form.carbs}
        onChange={(e) => handleChange("carbs", e.target.value)}
      />
      <input
        className="macro-input"
        type="text"
        inputMode="numeric"
        placeholder="fat (g)"
        value={form.fat}
        onChange={(e) => handleChange("fat", e.target.value)}
      />
      <button
        className="macro-save-btn"
        disabled={!canSave}
        onClick={() =>
          onSave(dish.id, {
            kcal: Number(form.kcal) || 0,
            protein: Number(form.protein),
            carbs: Number(form.carbs),
            fat: Number(form.fat),
          })
        }
      >
        Save
      </button>
    </div>
  );
}

export default function FatSecretSyncModal({ cart, onSkip, onProceed }) {
  const [step, setStep] = useState("propose");
  // Bump this to force a re-render (and re-read of localStorage) after a manual save.
  const [, setMacroVersion] = useState(0);

  useEffect(() => {
    if (step !== "oauth-connecting") return;
    const timer = setTimeout(() => {
      fatsecretService.connect();
      console.log("fatsecret_account_linked", {
        user_id: fatsecretService.MOCK_USER_ID,
        timestamp: new Date().toISOString(),
      });
      setStep("syncing");
    }, 1500);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (step !== "syncing") return;
    const orderId = "FS-" + Math.floor(10000 + Math.random() * 90000);
    const timer = setTimeout(() => {
      cart.forEach((item) => {
        const resolved = fatsecretService.lookupMacros(item);
        console.log("order_synced_to_fatsecret", {
          user_id: fatsecretService.MOCK_USER_ID,
          order_id: orderId,
          sync_method: resolved?.source === "user_input" ? "manual" : "auto",
          macro_source: resolved?.source,
        });
      });
      setStep("synced");
    }, 1200);
    return () => clearTimeout(timer);
  }, [step, cart]);

  function handleOverlayClick() {
    if (step !== "oauth-connecting" && step !== "syncing") onSkip();
  }

  function handleSaveManualMacros(dishId, macros) {
    fatsecretService.saveManualMacros(dishId, macros);
    setMacroVersion((v) => v + 1);
  }

  // Recomputed every render, including after a manual save bumps macroVersion below.
  const resolvedMacros = cart.map((item) => fatsecretService.lookupMacros(item));
  const allResolved = resolvedMacros.every(Boolean);

  function handleAddToFatSecret() {
    setStep(fatsecretService.isLinked() ? "syncing" : "oauth-connect");
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {step === "propose" && (
          <div className="modal-step">
            <h2 className="modal-title">Add this order to FatSecret?</h2>
            <ul className="modal-item-list">
              {cart.map((item, i) => {
                const resolved = resolvedMacros[i];
                return (
                  <li key={item.id} className="modal-item-row modal-item-row--macro">
                    <span className="modal-item-emoji">{item.emoji}</span>
                    <div className="modal-item-main">
                      <span className="modal-item-name">{item.name}</span>
                      {resolved ? (
                        <span className="macro-line">
                          {resolved.macros.kcal} kcal · {resolved.macros.protein}g protein ·{" "}
                          {resolved.macros.carbs}g carbs · {resolved.macros.fat}g fat
                        </span>
                      ) : (
                        <>
                          <span className="macro-missing">
                            Nutritional values unavailable — add manually
                          </span>
                          <ManualMacroForm dish={item} onSave={handleSaveManualMacros} />
                        </>
                      )}
                    </div>
                    <span className="modal-item-qty">x{item.quantity}</span>
                  </li>
                );
              })}
            </ul>
            <div className="modal-actions">
              <button className="modal-btn-secondary" onClick={onSkip}>Skip</button>
              <button
                className="modal-btn-primary"
                disabled={!allResolved}
                onClick={handleAddToFatSecret}
              >
                Add to FatSecret
              </button>
            </div>
          </div>
        )}

        {step === "oauth-connect" && (
          <div className="modal-step">
            <h2 className="modal-title">Connect your FatSecret account</h2>
            <p className="processing-subtitle">
              Connect your FatSecret account to sync this order's macros.
            </p>
            <div className="modal-actions">
              <button className="modal-btn-secondary" onClick={onSkip}>Cancel</button>
              <button className="modal-btn-primary" onClick={() => setStep("oauth-connecting")}>
                Connect
              </button>
            </div>
          </div>
        )}

        {step === "oauth-connecting" && (
          <div className="modal-step modal-step-centered">
            <div className="spinner" />
            <p className="processing-title">Connecting to FatSecret…</p>
            <p className="processing-subtitle">Please do not close this window.</p>
          </div>
        )}

        {step === "syncing" && (
          <div className="modal-step modal-step-centered">
            <div className="spinner" />
            <p className="processing-title">Syncing your order to FatSecret…</p>
          </div>
        )}

        {step === "synced" && (
          <div className="modal-step modal-step-centered">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Added to FatSecret</h2>
            <ul className="modal-item-list modal-item-list--receipt">
              {cart.map((item) => (
                <li key={item.id} className="modal-item-row">
                  <span className="modal-item-emoji">{item.emoji}</span>
                  <span className="modal-item-name">{item.name}</span>
                  <span className="modal-item-qty">x{item.quantity}</span>
                </li>
              ))}
            </ul>
            <button className="modal-btn-primary modal-btn-full" onClick={onProceed}>
              Continue to Payment
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
