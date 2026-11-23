'use client';

import { useCart } from './CartProvider';
import { useT } from './I18n';

export function CartButton() {
  const { count, toggle } = useCart();
  const t = useT();
  return (
    <button type="button" className="header-btn" onClick={toggle}>
      <i className="fas fa-shopping-cart" /><span className="hidden-mobile">{t('Panier')}</span><span className="cart-badge" id="cartBadge">{count}</span>
    </button>
  );
}
