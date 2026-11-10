// Convert English numeric digits to Bengali digits
export function toBengaliNumerals(value: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(value).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

// Format currency in standard notation (e.g. "৳283/-" or "৳২৮৩/-")
export function formatTaka(amount: number, options?: { showBengali?: boolean }): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return options?.showBengali ? '০.০০ ৳' : '0.00 ৳';
  }
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (options?.showBengali) {
    return `${toBengaliNumerals(formatted)} ৳`;
  }
  return `${formatted} ৳`;
}

export function formatTakaSlash(amount: number, options?: { showBengali?: boolean }): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return options?.showBengali ? '৳০/-' : '৳0/-';
  }
  const formatted = Math.round(amount).toLocaleString('en-IN');
  if (options?.showBengali) {
    return `৳${toBengaliNumerals(formatted)}/-`;
  }
  return `৳${formatted}/-`;
}

export function formatTakaDecimal(amount: number, options?: { showBengali?: boolean }): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return options?.showBengali ? '৳০.০০/-' : '৳0.00/-';
  }
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (options?.showBengali) {
    return `৳${toBengaliNumerals(formatted)}/-`;
  }
  return `৳${formatted}/-`;
}

// Format date matching the interface: English: "Thursday 22/10/2026" / Bengali: "বৃহস্পতিবার ২২/১০/২০২৬"
export function formatHeaderDate(date: Date = new Date(), isBengali: boolean = false): string {
  const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const bengaliDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  
  const dayName = isBengali ? bengaliDays[date.getDay()] : englishDays[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  if (isBengali) {
    const bDate = `${toBengaliNumerals(dd)}/${toBengaliNumerals(mm)}/${toBengaliNumerals(yyyy)}`;
    return `${dayName} ${bDate}`;
  }
  return `${dayName} ${dd}/${mm}/${yyyy}`;
}

// Format full date & time (e.g. "22/10/2026 · 11:55 AM")
export function formatFullDateTime(date: Date = new Date(), isBengali: boolean = false): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (isBengali) {
    return `${toBengaliNumerals(dd)}/${toBengaliNumerals(mm)}/${toBengaliNumerals(yyyy)} · ${toBengaliNumerals(timeStr)}`;
  }
  return `${dd}/${mm}/${yyyy} · ${timeStr}`;
}

// Format time with seconds (e.g. "11:55:30 AM" or "১১:৫৫:৩০ AM")
export function formatTimeOnly(date: Date = new Date(), isBengali: boolean = false): string {
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return isBengali ? toBengaliNumerals(timeStr) : timeStr;
}

// Numbers 0-99 in Bengali words
const BN_0_TO_99: Record<number, string> = {
  0: 'শূন্য', 1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়', 10: 'দশ',
  11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ', 15: 'পনেরো', 16: 'ষোলো', 17: 'সতেরো', 18: 'আঠারো', 19: 'উনিশ', 20: 'বিশ',
  21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আঠাশ', 29: 'উনত্রিশ', 30: 'ত্রিশ',
  31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ', 40: 'চল্লিশ',
  41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ', 50: 'পঞ্চাশ',
  51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'উনষাট', 60: 'ষাট',
  61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর', 70: 'সত্তর',
  71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'উনআশি', 80: 'আশি',
  81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'অষ্টআশি', 89: 'উননব্বই', 90: 'নব্বই',
  91: 'একানব্বই', 92: 'বিরানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
};

function numberToBengaliWords(num: number): string {
  if (num === 0) return 'শূন্য টাকা মাত্র';
  let n = Math.abs(Math.round(num));

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  n %= 100;

  let parts: string[] = [];
  if (crore > 0) parts.push(`${numberToBengaliWords(crore).replace(' টাকা মাত্র', '')} কোটি`);
  if (lakh > 0) parts.push(`${BN_0_TO_99[lakh] || lakh} লাখ`);
  if (thousand > 0) parts.push(`${BN_0_TO_99[thousand] || thousand} হাজার`);
  if (hundred > 0) parts.push(`${BN_0_TO_99[hundred] || hundred} শত`);
  if (n > 0) parts.push(BN_0_TO_99[n] || String(n));

  return `${parts.join(' ')} টাকা মাত্র`;
}

// Convert number to words in English
function numberToEnglishWords(num: number): string {
  if (num === 0) return 'Zero Taka Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  let n = Math.abs(Math.round(num));
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  n %= 100;

  let str = '';
  if (crore > 0) str += `${numberToEnglishWords(crore).replace(' Taka Only', '')} Crore `;
  if (lakh > 0) str += `${numberToEnglishWords(lakh).replace(' Taka Only', '')} Lakh `;
  if (thousand > 0) str += `${numberToEnglishWords(thousand).replace(' Taka Only', '')} Thousand `;
  if (hundred > 0) str += `${numberToEnglishWords(hundred).replace(' Taka Only', '')} Hundred `;

  if (n > 0) {
    if (str !== '') str += 'and ';
    if (n < 20) str += a[n];
    else {
      str += b[Math.floor(n / 10)];
      if (n % 10 > 0) str += `-${a[n % 10]}`;
    }
  }

  return `${str.trim()} Taka Only`;
}

// Number to words supporting both Bengali and English
export function numberToWords(num: number, isBengali: boolean = false): string {
  return isBengali ? numberToBengaliWords(num) : numberToEnglishWords(num);
}
