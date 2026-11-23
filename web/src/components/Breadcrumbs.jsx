import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

/**
 * Intelligent breadcrumb generator for routes when no explicit items are provided
 */
export function getAutoBreadcrumbs(pathname) {
  if (!pathname || pathname === '/' || pathname.startsWith('/admin')) {
    return null;
  }

  const items = [{ label: 'Home', path: '/' }];
  const cleanPath = pathname.replace(/\/+$/, '');

  // 1. All products / catalog
  if (cleanPath === '/all-products' || cleanPath === '/products') {
    items.push({ label: 'All Products' });
    return items;
  }

  // 2. Category slug
  if (cleanPath.startsWith('/category/')) {
    const slug = cleanPath.replace('/category/', '');
    const formatted = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({ label: 'All Products', path: '/all-products' });
    items.push({ label: formatted });
    return items;
  }

  // 3. Product details
  if (cleanPath.startsWith('/product/') || cleanPath.startsWith('/products/')) {
    items.push({ label: 'All Products', path: '/all-products' });
    items.push({ label: 'Product Details' });
    return items;
  }

  // 4. Cart & Checkout
  if (cleanPath === '/cart' || cleanPath === '/payment') {
    items.push({ label: 'Cart' });
    return items;
  }

  if (cleanPath === '/checkout') {
    items.push({ label: 'Cart', path: '/cart' });
    items.push({ label: 'Checkout' });
    return items;
  }

  // 5. Static Pages
  if (cleanPath === '/about') {
    items.push({ label: 'About Us' });
    return items;
  }
  if (cleanPath === '/contact') {
    items.push({ label: 'Contact Us' });
    return items;
  }
  if (cleanPath === '/privacy') {
    items.push({ label: 'Privacy Policy' });
    return items;
  }
  if (cleanPath === '/terms') {
    items.push({ label: 'Terms of Service' });
    return items;
  }

  // 6. User Account & Orders
  if (cleanPath === '/profile') {
    items.push({ label: 'My Account' });
    return items;
  }
  if (cleanPath === '/profile/orders') {
    items.push({ label: 'My Account', path: '/profile' });
    items.push({ label: 'Orders' });
    return items;
  }
  if (cleanPath === '/profile/addresses') {
    items.push({ label: 'My Account', path: '/profile' });
    items.push({ label: 'Addresses' });
    return items;
  }
  if (cleanPath.startsWith('/profile/orders/track/') || cleanPath.startsWith('/track-order/')) {
    items.push({ label: 'My Account', path: '/profile' });
    items.push({ label: 'Orders', path: '/profile/orders' });
    items.push({ label: 'Track Order' });
    return items;
  }

  // 7. Auth Pages
  if (cleanPath === '/login' || cleanPath === '/account/login') {
    items.push({ label: 'Login' });
    return items;
  }
  if (cleanPath === '/signup' || cleanPath === '/account/signup') {
    items.push({ label: 'Sign Up' });
    return items;
  }
  if (cleanPath === '/otp-verify' || cleanPath === '/account/otp-verify') {
    items.push({ label: 'Login', path: '/login' });
    items.push({ label: 'Verify OTP' });
    return items;
  }

  // 8. General fallback for single / multi segment paths
  const segments = cleanPath.split('/').filter(Boolean);
  let currentPath = '';
  segments.forEach((seg, idx) => {
    currentPath += `/${seg}`;
    const formatted = seg.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    items.push(idx === segments.length - 1 ? { label: formatted } : { label: formatted, path: currentPath });
  });

  return items;
}

export default function Breadcrumbs({ items: explicitItems }) {
  const location = useLocation();

  const items = explicitItems && explicitItems.length > 0
    ? explicitItems
    : getAutoBreadcrumbs(location.pathname);

  if (!items || items.length <= 1) {
    return null;
  }

  return (
    <nav className="site-breadcrumbs-bar" aria-label="Breadcrumb navigation">
      <div className="site-breadcrumbs-container">
        <ol className="site-breadcrumbs-list">
          {items.map((item, index) => {
            const label = item.label || item.name;
            const path = item.path;
            const isLast = index === items.length - 1;

            return (
              <li key={index} className="site-breadcrumbs-item">
                {index > 0 && (
                  <span className="site-breadcrumbs-separator" aria-hidden="true">
                    &gt;
                  </span>
                )}
                {isLast || !path ? (
                  <span
                    className="site-breadcrumbs-current"
                    aria-current={isLast ? "page" : undefined}
                    title={label}
                  >
                    {label}
                  </span>
                ) : (
                  <Link to={path} className="site-breadcrumbs-link">
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
