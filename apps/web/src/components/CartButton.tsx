'use client';

import { useCart } from './CartProvider';

export function CartButton() {
  const { count, toggle } = useCart();
  return (
    <button type="button" className="header-btn" onClick={toggle}>
      <i className="fas fa-shopping-cart" /><span className="hidden-mobile">Panier</span><span className="cart-badge" id="cartBadge">{count}</span>
    </button>
  );
}
