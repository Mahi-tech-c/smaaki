/**
 * SEO & Social Share metadata utility
 * Dynamically synchronizes document title, canonical link, and OpenGraph/Twitter meta tags
 * for client-side SPA route transitions.
 */

function setMetaTag(selector, attributeName, attributeValue, contentValue) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', contentValue || '');
}

function setCanonicalLink(href) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Updates SEO meta tags for current page view
 */
export function updateSeoMetadata({
  title,
  description,
  url,
  image,
  type = 'website'
} = {}) {
  if (typeof document === 'undefined') return;

  // Title
  if (title) {
    document.title = title;
    setMetaTag("meta[property='og:title']", 'property', 'og:title', title);
    setMetaTag("meta[name='twitter:title']", 'name', 'twitter:title', title);
  }

  // Description
  if (description) {
    setMetaTag("meta[name='description']", 'name', 'description', description);
    setMetaTag("meta[property='og:description']", 'property', 'og:description', description);
    setMetaTag("meta[name='twitter:description']", 'name', 'twitter:description', description);
  }

  // Canonical URL & OG URL
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  if (targetUrl) {
    setCanonicalLink(targetUrl);
    setMetaTag("meta[property='og:url']", 'property', 'og:url', targetUrl);
  }

  // Type
  if (type) {
    setMetaTag("meta[property='og:type']", 'property', 'og:type', type);
  }

  // Social Share Image
  if (image) {
    setMetaTag("meta[property='og:image']", 'property', 'og:image', image);
    setMetaTag("meta[name='twitter:image']", 'name', 'twitter:image', image);
  }
}

/**
 * Resolves SEO titles and descriptions given pathname and cafe settings
 */
export function getRouteSeo(pathname = '/', settings = {}) {
  const brandName = settings.restaurantName || 'Smaakenzzoo';
  const defaultDesc = settings.metaDescription || 
    'Artisanal Cafe & Roastery in Warangal, Telangana. Handcrafted specialty coffees, signature Belgian & bubble waffles, gourmet burgers, pizzas and artisanal sundaes.';

  if (pathname === '/') {
    return {
      title: settings.metaTitle || `${brandName} - Artisanal Cafe & Roastery | Warangal`,
      description: defaultDesc,
      type: 'restaurant'
    };
  }

  if (pathname.startsWith('/table/')) {
    const tableId = pathname.split('/')[2];
    return {
      title: `Table #${tableId} Dine-In Menu | ${brandName}`,
      description: `Order fresh artisanal coffee, waffles, burgers & shakes directly to Table ${tableId} at ${brandName}.`,
      type: 'food'
    };
  }

  if (pathname.startsWith('/track/')) {
    const orderId = pathname.split('/')[2];
    return {
      title: `Live Order #${orderId} | ${brandName}`,
      description: `Track your live kitchen prep and delivery status in real-time at ${brandName}.`,
      type: 'website'
    };
  }

  if (pathname === '/track') {
    return {
      title: `Track Your Orders | ${brandName}`,
      description: `Live tracking for your active cafe orders and kitchen preparation.`,
      type: 'website'
    };
  }

  if (pathname === '/about') {
    return {
      title: `About Us | ${brandName} Artisanal Cafe`,
      description: `Discover the story, craft, and passion behind Smaakenzzoo - Warangal's premier artisanal coffee bar and dessert lounge.`,
      type: 'website'
    };
  }

  if (pathname === '/contact') {
    return {
      title: `Contact & Directions | ${brandName} Warangal`,
      description: `Find our location, phone number, hours of operation, and reservation inquiries.`,
      type: 'website'
    };
  }

  if (pathname === '/gallery') {
    return {
      title: `Atmosphere & Gallery | ${brandName}`,
      description: `Explore our artisanal space, cozy ambiance, specialty brews, and culinary craftsmanship.`,
      type: 'website'
    };
  }

  if (pathname === '/privacy') {
    return {
      title: `Privacy Policy | ${brandName}`,
      description: `Privacy policy and data protection practices at Smaakenzzoo.`,
      type: 'website'
    };
  }

  if (pathname === '/terms') {
    return {
      title: `Terms of Service | ${brandName}`,
      description: `Terms and conditions for dining and online orders at Smaakenzzoo.`,
      type: 'website'
    };
  }

  if (pathname === '/refunds') {
    return {
      title: `Cancellation & Refund Policy | ${brandName}`,
      description: `Order cancellation and refund policy details for Smaakenzzoo patrons.`,
      type: 'website'
    };
  }

  if (pathname.startsWith('/admin')) {
    return {
      title: `Admin Portal | ${brandName}`,
      description: `Kitchen Display System and administration console.`,
      type: 'website'
    };
  }

  return {
    title: `${brandName} - Artisanal Cafe & Roastery`,
    description: defaultDesc,
    type: 'website'
  };
}
