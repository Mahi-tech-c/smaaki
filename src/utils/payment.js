/**
 * Payment & UPI Integration Utilities
 * Smaakenzzoo Artisanal Cafe, Warangal
 */

/**
 * Builds a standard NPCI UPI URI string
 */
export const buildUpiUri = ({
  upiId,
  merchantName = 'Smaakenzzoo Cafe',
  amount,
  orderId,
  note = 'Artisanal Cafe Order'
}) => {
  if (!upiId) return '';

  const cleanAmount = Number(amount).toFixed(2);
  const cleanNote = `${orderId} - ${note}`;

  const params = new URLSearchParams({
    pa: upiId.trim(),
    pn: merchantName.trim(),
    am: cleanAmount,
    cu: 'INR',
    tn: cleanNote
  });

  return `upi://pay?${params.toString()}`;
};

/**
 * Generates specific app intent links for mobile UPI
 */
export const getUpiAppLinks = (upiUri) => {
  if (!upiUri) return [];

  const rawParams = upiUri.replace('upi://pay?', '');

  return [
    {
      name: 'Google Pay',
      scheme: `gpay://upi/pay?${rawParams}`,
      fallback: upiUri,
      color: 'bg-white text-slate-800'
    },
    {
      name: 'PhonePe',
      scheme: `phonepe://pay?${rawParams}`,
      fallback: upiUri,
      color: 'bg-[#5f259f] text-white'
    },
    {
      name: 'Paytm',
      scheme: `paytmmp://pay?${rawParams}`,
      fallback: upiUri,
      color: 'bg-[#00baf2] text-white'
    },
    {
      name: 'Any UPI App',
      scheme: upiUri,
      fallback: upiUri,
      color: 'bg-emerald-600 text-white'
    }
  ];
};
