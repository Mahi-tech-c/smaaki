import { useState, useEffect } from 'react';

export const useScrollDirection = ({ threshold = 10 } = {}) => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      setIsScrolled(scrollY > 20);

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      setScrollDirection(scrollY > lastScrollY && scrollY > 80 ? 'down' : 'up');
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { scrollDirection, isScrolled, isVisible: scrollDirection === 'up' };
};

export default useScrollDirection;
