"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/Badge";
import { PriceTag } from "@/components/PriceTag";
import { useCart } from "@/context/CartContext";
import { useMarket } from "@/context/MarketContext";
import { useT } from "@/i18n";

export default function CartPage() {
  const { t } = useT();
  const { country } = useMarket();
  const { items, updateQuantity, removeFromCart, clearCart, subtotalUsd, totalCount } = useCart();

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "airtel" | "orange" | "card">("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("81");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null);

  // Livraison disponible (total = sous-total)
  const totalUsd = subtotalUsd;

  // Handle checkout simulation
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedOrderNumber = `MW-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderConfirmed(generatedOrderNumber);
      clearCart();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white">
      <Header />

      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-3">
          <ol className="flex items-center gap-2 text-xs text-outline">
            <li>
              <Link href="/" className="hover:text-primary transition flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>{t("cart.breadcrumb_home")}</span>
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-on-surface font-semibold">{t("cart.breadcrumb_cart")} ({totalCount})</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Cart Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-8">
        {/* Order Confirmed Modal / Banner */}
        {orderConfirmed ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-secondary/30 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-modal space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                {t("cart.order_success_badge")}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-primary font-display">
                {t("cart.order_thank_you")}
              </h1>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                {t("cart.order_registered_text")} <strong className="text-primary font-bold">#{orderConfirmed}</strong>.{" "}
                <span className="font-semibold text-primary uppercase">
                  {paymentMethod === "card" ? t("cart.payment_card") : paymentMethod}
                </span>.
              </p>
            </div>

            {/* Escrow assurance recap in confirmation */}
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant text-xs text-left space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-secondary text-base">verified_user</span>
                <span>{t("cart.escrow_protected")}</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                {t("cart.order_confirmed_delivery")} {t("cart.escrow_unlocked_info")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href={`/suivi/${orderConfirmed}`}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow"
              >
                <span className="material-symbols-outlined text-base">track_changes</span>
                <span>{t("cart.track_my_order")}</span>
              </Link>
              <Link
                href="/produits"
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container font-semibold text-xs sm:text-sm transition text-center"
              >
                {t("cart.continue_shopping")}
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 sm:p-16 text-center max-w-xl mx-auto shadow-card space-y-6">
            <div className="w-20 h-20 bg-surface-container text-outline rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">shopping_cart_off</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-primary font-display">
                {t("cart.empty_title")}
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                {t("cart.empty_desc")}
              </p>
            </div>

            <Link
              href="/produits"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-tertiary hover:bg-tertiary-hover text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-md"
            >
              <span className="material-symbols-outlined text-lg">storefront</span>
              <span>{t("cart.explore_catalog")}</span>
            </Link>
          </div>
        ) : (
          /* 2-Columns Active Cart View */
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-primary font-display flex items-center gap-3">
                  <span>{t("cart.title")}</span>
                  <span className="text-xs font-bold bg-secondary-fixed text-on-secondary-container px-2.5 py-0.5 rounded-full">
                    {totalCount} {totalCount > 1 ? t("cart.articles_count") : t("cart.article_count")}
                  </span>
                </h1>
                <p className="text-xs text-on-surface-variant mt-1">
                  {t("cart.panafrican_catalog")} • {country.flag} {country.currency.code} — {t("cart.market_subtitle")}
                </p>
              </div>

              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-outline hover:text-rose-600 transition self-start sm:self-auto flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>{t("cart.clear_cart")}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ================= LEFT COLUMN: CART ITEMS & DELIVERY OPTIONS (~8 COLS) ================= */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Items List */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant divide-y divide-outline-variant/60 shadow-card overflow-hidden">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start justify-between hover:bg-surface-container-low/40 transition"
                    >
                      {/* Image + Info */}
                      <div className="flex gap-4 w-full sm:w-auto">
                        <Link
                          href={`/produits/${item.id}`}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-surface-container-low overflow-hidden shrink-0 border border-outline-variant block group relative"
                        >
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-secondary">
                              {item.shopName}
                            </span>
                            {item.shopCity && (
                              <span className="text-[11px] text-outline">• {item.shopCity}</span>
                            )}
                          </div>

                          <Link href={`/produits/${item.id}`} className="block">
                            <h3 className="text-sm sm:text-base font-bold text-primary hover:text-secondary transition-colors line-clamp-2 leading-snug font-display">
                              {item.title}
                            </h3>
                          </Link>

                          {/* Logistics route badge */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <Badge variant="express" text={t("cart.delivery_available")} />
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Price Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-outline-variant">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container-low">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container text-sm font-bold transition"
                            aria-label={t("cart.quantity_decrease")}
                          >
                            -
                          </button>
                          <span className="w-9 text-center font-bold text-xs text-primary tnum">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container text-sm font-bold transition"
                            aria-label={t("cart.quantity_increase")}
                          >
                            +
                          </button>
                        </div>

                        {/* PriceTag for line item */}
                        <div className="text-right">
                          <PriceTag
                            usdPrice={item.usdPrice * item.quantity}
                            originalUsdPrice={
                              item.originalUsdPrice ? item.originalUsdPrice * item.quantity : undefined
                            }
                            size="sm"
                          />
                        </div>

                        {/* Delete item button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 rounded-lg text-outline hover:text-rose-600 hover:bg-rose-50 transition"
                          title={t("cart.delete_item")}
                          aria-label={t("cart.delete_item")}
                        >
                          <span className="material-symbols-outlined text-lg">delete_outline</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* 2. Delivery availability status card */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 sm:p-6 shadow-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          local_shipping
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-primary font-display">
                          {t("cart.delivery_available")}
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          {t("cart.delivery_available_desc")}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                      <span>{t("cart.delivery_available_val")}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Payment Method Selection */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 sm:p-6 shadow-card space-y-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-primary font-display flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-xl">payments</span>
                      <span>{t("cart.payment_certified")}</span>
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {t("cart.payment_subtitle")}
                    </p>
                  </div>

                  {/* Payment Methods Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* M-Pesa */}
                    <div
                      onClick={() => setPaymentMethod("mpesa")}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition text-center space-y-1.5 flex flex-col items-center justify-center ${
                        paymentMethod === "mpesa"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                          : "border-outline-variant hover:border-slate-300 bg-surface-container-low/50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                        M
                      </div>
                      <span className="text-xs font-bold text-primary block">M-Pesa</span>
                      <span className="text-[10px] text-emerald-700 font-semibold block">{t("cart.payment_mpesa_sub")}</span>
                    </div>

                    {/* Airtel Money */}
                    <div
                      onClick={() => setPaymentMethod("airtel")}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition text-center space-y-1.5 flex flex-col items-center justify-center ${
                        paymentMethod === "airtel"
                          ? "border-rose-600 bg-rose-50/50 shadow-sm"
                          : "border-outline-variant hover:border-slate-300 bg-surface-container-low/50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                        A
                      </div>
                      <span className="text-xs font-bold text-primary block">Airtel Money</span>
                      <span className="text-[10px] text-rose-700 font-semibold block">{t("cart.payment_airtel_sub")}</span>
                    </div>

                    {/* Orange Money */}
                    <div
                      onClick={() => setPaymentMethod("orange")}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition text-center space-y-1.5 flex flex-col items-center justify-center ${
                        paymentMethod === "orange"
                          ? "border-amber-600 bg-amber-50/50 shadow-sm"
                          : "border-outline-variant hover:border-slate-300 bg-surface-container-low/50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                        O
                      </div>
                      <span className="text-xs font-bold text-primary block">Orange Money</span>
                      <span className="text-[10px] text-amber-700 font-semibold block">{t("cart.payment_orange_sub")}</span>
                    </div>

                    {/* Carte Bancaire */}
                    <div
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition text-center space-y-1.5 flex flex-col items-center justify-center ${
                        paymentMethod === "card"
                          ? "border-secondary bg-sky-50/50 shadow-sm"
                          : "border-outline-variant hover:border-slate-300 bg-surface-container-low/50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary text-white font-black text-xs flex items-center justify-center">
                        <span className="material-symbols-outlined text-base">credit_card</span>
                      </div>
                      <span className="text-xs font-bold text-primary block">{t("cart.payment_card")}</span>
                      <span className="text-[10px] text-secondary font-semibold block">{t("cart.payment_card_sub")}</span>
                    </div>
                  </div>

                  {/* Mobile Money Phone Input */}
                  {paymentMethod !== "card" ? (
                    <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant space-y-2">
                      <label htmlFor="mm-phone" className="block text-xs font-bold text-primary">
                        {t("cart.mm_account_label")}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-bold text-primary">
                          {country.phoneCode || "+243"}
                        </span>
                        <input
                          id="mm-phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="81 000 0000"
                          className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                      </div>
                      <p className="text-[11px] text-on-surface-variant">
                        {t("cart.mm_account_hint")}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant text-xs text-on-surface-variant">
                      {t("cart.card_secure_desc")}
                    </div>
                  )}
                </div>
              </div>

              {/* ================= RIGHT COLUMN: ORDER SUMMARY STICKY (~4 COLS) ================= */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-card space-y-5">
                  <h3 className="text-base sm:text-lg font-bold text-primary font-display pb-3 border-b border-outline-variant">
                    {t("cart.summary_title")}
                  </h3>

                  {/* Subtotal & Delivery details */}
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>{t("cart.subtotal")} ({totalCount} {totalCount > 1 ? t("cart.articles_count") : t("cart.article_count")})</span>
                      <span className="font-semibold text-primary">{subtotalUsd} $</span>
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>{t("cart.delivery_available")}</span>
                      <span className="font-semibold text-emerald-600">{t("cart.delivery_available_val")}</span>
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>{t("cart.insurance_escrow")}</span>
                      <span className="font-semibold text-emerald-600">{t("cart.free_included")}</span>
                    </div>

                    <div className="pt-3 border-t border-outline-variant flex flex-col gap-1">
                      <span className="text-xs uppercase font-bold text-outline">{t("cart.total_to_pay")}</span>
                      <PriceTag usdPrice={totalUsd} size="lg" />
                    </div>
                  </div>

                  {/* Escrow assurance badge */}
                  <div className="p-3.5 bg-secondary/10 border border-secondary/20 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        shield
                      </span>
                      <span>{t("cart.escrow_title")}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {t("cart.escrow_desc")}
                    </p>
                  </div>

                  {/* Orange Primary Checkout CTA */}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isSubmitting || items.length === 0}
                    className="w-full py-4 px-6 rounded-xl bg-tertiary hover:bg-tertiary-hover disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-xl animate-spin">refresh</span>
                        <span>{t("cart.checkout_processing")}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">lock</span>
                        <span>{t("cart.checkout_btn")} ({totalUsd} $)</span>
                      </>
                    )}
                  </button>

                  {/* Payment Badges Strip */}
                  <div className="pt-2 border-t border-outline-variant text-center space-y-2">
                    <span className="text-[10px] text-outline font-semibold uppercase tracking-wider block">
                      {t("cart.secure_transactions")}
                    </span>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold text-on-surface">
                        M-Pesa
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold text-on-surface">
                        Airtel Money
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold text-on-surface">
                        Orange Money
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold text-on-surface">
                        Visa / MC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assistance hotline callout */}
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-secondary text-xl shrink-0">support_agent</span>
                  <div>
                    <p className="font-bold text-primary">{t("cart.need_help")}</p>
                    <p className="text-[11px]">{t("cart.hotline_prefix")} <strong>+243 81 000 9999</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
