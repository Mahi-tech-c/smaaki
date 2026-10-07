/**
 * Real-time Cafe Operating Hours & Live Status
 * Timezone: Asia/Kolkata (IST = UTC+5:30)
 * Flourishing Hearts, Blooming Dreams - Smaakenzzoo Artisanal Cafe
 */

export const getKolkataStatus = (settings = {}) => {
  try {
    const now = new Date();
    // Get current time formatted specifically in Asia/Kolkata
    const kolkataParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now);

    const hourPart = kolkataParts.find((p) => p.type === 'hour');
    const minutePart = kolkataParts.find((p) => p.type === 'minute');

    const currentHour = parseInt(hourPart?.value || '12', 10);
    const currentMinute = parseInt(minutePart?.value || '0', 10);
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Standard hours: 11:00 AM (660 mins) to 11:00 PM (1380 mins)
    const openTime = settings.openTime || '11:00';
    const closeTime = settings.closeTime || '23:00';

    const [openH, openM] = openTime.split(':').map((v) => parseInt(v, 10) || 0);
    const [closeH, closeM] = closeTime.split(':').map((v) => parseInt(v, 10) || 0);

    const openTotal = openH * 60 + openM;
    const closeTotal = closeH * 60 + closeM;

    // Check manual override
    if (settings.isOpen === false) {
      return {
        isOpen: false,
        statusText: 'Closed',
        detailText: 'Currently closed for dining',
        color: 'red'
      };
    }

    const isOpenNow = currentTotalMinutes >= openTotal && currentTotalMinutes < closeTotal;

    if (isOpenNow) {
      return {
        isOpen: true,
        statusText: 'Open Now',
        detailText: 'Closes at 11:00 PM',
        color: 'emerald'
      };
    }

    return {
      isOpen: false,
      statusText: 'Closed',
      detailText: 'Opens at 11:00 AM',
      color: 'rose'
    };
  } catch {
    return {
      isOpen: true,
      statusText: 'Open Now',
      detailText: '11:00 AM - 11:00 PM',
      color: 'emerald'
    };
  }
};
