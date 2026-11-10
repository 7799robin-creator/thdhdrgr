import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  History, 
  Share2, 
  Check, 
  Plus, 
  Edit3, 
  X,
  CreditCard,
  Banknote,
  Trash,
  Minus,
  Calendar,
  Clock,
  ChevronRight,
  Wallet,
  Palette,
  Boxes,
  Package
} from 'lucide-react';
import { 
  formatHeaderDate, 
  formatTimeOnly,
  formatTakaSlash, 
  formatTakaDecimal,
  numberToWords, 
  toBengaliNumerals 
} from '../utils/formatters';
import { CashNoteItem, MinuteCardItem, SavedTally } from '../types';

type Language = 'bn' | 'en';

// Bangladeshi cash denominations
const INITIAL_CASH_NOTES: CashNoteItem[] = [
  { id: '1000', label: '1000X', value: 1000, quantity: '' },
  { id: '500',  label: '500X',  value: 500,  quantity: '' },
  { id: '200',  label: '200X',  value: 200,  quantity: '' },
  { id: '100',  label: '100X',  value: 100,  quantity: '' },
  { id: '50',   label: '50X',   value: 50,   quantity: '' },
  { id: '20',   label: '20X',   value: 20,   quantity: '' },
  { id: '10',   label: '10X',   value: 10,   quantity: '' },
  { id: '05',   label: '05X',   value: 5,    quantity: '' },
  { id: '02',   label: '02X',   value: 2,    quantity: '' },
  { id: '01',   label: '01X',   value: 1,    quantity: '' },
];

// Helper to assign card voucher themes based on MRP
function getCardTheme(mrp: number) {
  if (mrp === 29) {
    return {
      bg: 'bg-gradient-to-r from-[#007a4d] to-[#046c44]',
      border: 'border-emerald-500/40',
      badge: 'bg-emerald-600/70 border-emerald-300/40 text-emerald-100',
      accent: 'text-emerald-200'
    };
  }
  if (mrp === 19) {
    return {
      bg: 'bg-gradient-to-r from-[#0284c7] to-[#0369a1]',
      border: 'border-sky-500/40',
      badge: 'bg-sky-600/70 border-sky-300/40 text-sky-100',
      accent: 'text-sky-200'
    };
  }
  if (mrp === 49) {
    return {
      bg: 'bg-gradient-to-r from-[#7c3aed] to-[#6d28d9]',
      border: 'border-purple-500/40',
      badge: 'bg-purple-600/70 border-purple-300/40 text-purple-100',
      accent: 'text-purple-200'
    };
  }
  if (mrp === 99) {
    return {
      bg: 'bg-gradient-to-r from-[#b45309] to-[#92400e]',
      border: 'border-amber-500/40',
      badge: 'bg-amber-600/70 border-amber-300/40 text-amber-100',
      accent: 'text-amber-200'
    };
  }
  if (mrp === 199) {
    return {
      bg: 'bg-gradient-to-r from-[#e11d48] to-[#be123c]',
      border: 'border-rose-500/40',
      badge: 'bg-rose-600/70 border-rose-300/40 text-rose-100',
      accent: 'text-rose-200'
    };
  }
  return {
    bg: 'bg-gradient-to-r from-[#007a4d] to-[#0b8054]',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-600/70 border-emerald-300/40 text-emerald-100',
    accent: 'text-emerald-200'
  };
}

// Helper to extract or resolve MRP from a breakdown item
function getMrpFromItem(item: { label: string; rate: number; mrp?: number }): number {
  if (typeof item.mrp === 'number' && item.mrp > 0) return item.mrp;
  // Try extracting English digits
  const engMatch = item.label.match(/\d+/);
  if (engMatch) {
    const parsed = parseInt(engMatch[0], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // Convert Bengali numerals if any
  const bengaliDigits: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const converted = item.label.replace(/[০-৯]/g, (d) => bengaliDigits[d] || d);
  const matchConverted = converted.match(/\d+/);
  if (matchConverted) {
    const parsed = parseInt(matchConverted[0], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // Try matching wholesale rates
  if (Math.abs(item.rate - 28.30) < 0.2) return 29;
  if (Math.abs(item.rate - 18.50) < 0.2) return 19;
  if (Math.abs(item.rate - 47.80) < 0.2) return 49;
  if (Math.abs(item.rate - 96.50) < 0.2) return 99;
  if (Math.abs(item.rate - 194.00) < 0.5) return 199;
  return 29;
}

// Initial Minute Cards with Stock
const INITIAL_MINUTE_CARDS: MinuteCardItem[] = [
  { id: 'mc_29',  name: '29 Tk Minute Card',  cardPrice: 29,  unitPrice: 28.30, quantity: '10', stock: 50 },
  { id: 'mc_19',  name: '19 Tk Minute Card',  cardPrice: 19,  unitPrice: 18.50, quantity: '',   stock: 50 },
  { id: 'mc_49',  name: '49 Tk Minute Card',  cardPrice: 49,  unitPrice: 47.80, quantity: '',   stock: 30 },
  { id: 'mc_99',  name: '99 Tk Minute Card',  cardPrice: 99,  unitPrice: 96.50, quantity: '',   stock: 20 },
  { id: 'mc_199', name: '199 Tk Minute Card', cardPrice: 199, unitPrice: 194.00, quantity: '',   stock: 10 },
];

export const CashCounter: React.FC = () => {
  // Language state ('bn' or 'en') with persistent storage
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language_pref');
      if (saved === 'en' || saved === 'bn') return saved;
    } catch {
      // fallback
    }
    return 'bn';
  });

  const isBn = language === 'bn';

  useEffect(() => {
    try {
      localStorage.setItem('app_language_pref', language);
    } catch {
      // ignore
    }
  }, [language]);

  const [currentView, setCurrentView] = useState<'home' | 'minute_card' | 'cash_notes' | 'history'>('home');
  const [previousView, setPreviousView] = useState<'home' | 'minute_card' | 'cash_notes'>('home');
  const [mode, setMode] = useState<'minute_card' | 'cash_notes'>('minute_card');
  const [cashNotes, setCashNotes] = useState<CashNoteItem[]>(INITIAL_CASH_NOTES);
  
  // Minute Cards state with local storage persistence and stock migration
  const [minuteCards, setMinuteCards] = useState<MinuteCardItem[]>(() => {
    try {
      const saved = localStorage.getItem('minute_card_list_custom_v3') || localStorage.getItem('minute_card_list_custom_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: MinuteCardItem) => ({
            ...item,
            stock: typeof item.stock === 'number' && !isNaN(item.stock) ? item.stock : 50
          }));
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_MINUTE_CARDS;
  });

  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Footer color theme preference with local storage persistence
  const [footerTheme, setFooterTheme] = useState<'slate' | 'emerald' | 'navy'>(() => {
    try {
      const saved = localStorage.getItem('app_footer_theme');
      if (saved === 'slate' || saved === 'emerald' || saved === 'navy') return saved;
    } catch {
      // fallback
    }
    return 'slate';
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_footer_theme', footerTheme);
    } catch {
      // ignore
    }
  }, [footerTheme]);

  const footerThemeStyles = useMemo(() => {
    switch (footerTheme) {
      case 'emerald':
        return {
          wrapper: 'bg-[#064e3b] border-t border-emerald-800 text-white shadow-2xl',
          drawer: 'bg-[#043326] border-b border-emerald-800/80 text-emerald-100',
          drawerLabel: 'text-emerald-200/90',
          drawerValue: 'text-white font-mono',
          drawerProfit: 'text-yellow-300 font-mono',
          drawerDivider: 'border-emerald-800/80',
          inWordsLabel: 'text-emerald-200/80',
          inWordsValue: 'text-amber-200',
          countBadge: 'bg-emerald-800/80 text-emerald-100 border-emerald-700/60',
          actionBtn: 'hover:bg-emerald-800 active:bg-emerald-700 text-emerald-100 hover:text-white',
          borderDivider: 'border-emerald-700/50',
          totalLabel: 'text-emerald-200',
          totalAmount: 'text-white'
        };
      case 'navy':
        return {
          wrapper: 'bg-[#0f172a] border-t border-slate-800 text-white shadow-2xl',
          drawer: 'bg-[#070b14] border-b border-slate-800 text-slate-300',
          drawerLabel: 'text-blue-200/80',
          drawerValue: 'text-white font-mono',
          drawerProfit: 'text-emerald-400 font-mono',
          drawerDivider: 'border-slate-800',
          inWordsLabel: 'text-slate-400',
          inWordsValue: 'text-sky-300',
          countBadge: 'bg-blue-950/90 text-cyan-300 border-blue-900/60',
          actionBtn: 'hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white',
          borderDivider: 'border-slate-800',
          totalLabel: 'text-blue-200',
          totalAmount: 'text-cyan-300'
        };
      case 'slate':
      default:
        return {
          wrapper: 'bg-slate-900 border-t border-slate-800 text-white shadow-2xl',
          drawer: 'bg-slate-950 border-b border-slate-800 text-slate-300',
          drawerLabel: 'text-slate-400',
          drawerValue: 'text-white font-mono',
          drawerProfit: 'text-emerald-400 font-mono',
          drawerDivider: 'border-slate-800',
          inWordsLabel: 'text-slate-400',
          inWordsValue: 'text-amber-300',
          countBadge: 'bg-slate-800/90 text-emerald-400 border-slate-700/60',
          actionBtn: 'hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white',
          borderDivider: 'border-slate-800',
          totalLabel: 'text-slate-300',
          totalAmount: 'text-emerald-400'
        };
    }
  }, [footerTheme]);
  
  // Add new card modal state
  const [showAddCardModal, setShowAddCardModal] = useState<boolean>(false);
  const [newCardName, setNewCardName] = useState<string>('29 Tk Minute Card');
  const [newCardMrp, setNewCardMrp] = useState<string>('29');
  const [newCardRate, setNewCardRate] = useState<string>('28.30');
  const [newCardStock, setNewCardStock] = useState<string>('50');

  // Edit card modal state
  const [editingCard, setEditingCard] = useState<MinuteCardItem | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');
  const [editMrpValue, setEditMrpValue] = useState<string>('');
  const [editRateValue, setEditRateValue] = useState<string>('');
  const [editStockValue, setEditStockValue] = useState<string>('50');

  // Stock modal state (Add & Manage Stock inside Minute Card)
  const [stockModalCard, setStockModalCard] = useState<MinuteCardItem | null>(null);
  const [stockInputDelta, setStockInputDelta] = useState<string>('10');
  const [stockMode, setStockMode] = useState<'add' | 'set'>('add');

  // Save modal state with custom name
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveTallyName, setSaveTallyName] = useState<string>('');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyTab, setHistoryTab] = useState<'minute_card' | 'cash_notes' | 'all'>('minute_card');
  const [collapsedHistoryIds, setCollapsedHistoryIds] = useState<Record<string, boolean>>({});

  // Previously used calculation names for auto suggestions
  const [recentSavedNames, setRecentSavedNames] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cash_counter_recent_names');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // History state
  const [savedTallies, setSavedTallies] = useState<SavedTally[]>(() => {
    try {
      const stored = localStorage.getItem('minute_card_tallies');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Dynamically generated suggestions from saved calculation names
  const dynamicSuggestions = useMemo(() => {
    const fromTallies = savedTallies
      .map((t) => t.title?.trim())
      .filter((title): title is string => Boolean(title && title.length > 0));
    
    const combined = Array.from(new Set([...recentSavedNames, ...fromTallies]));
    if (combined.length === 0) {
      return isBn
        ? ['সকালের হিসাব', 'বিকালের হিসাব', 'দৈনিক ক্লোজিং', 'দোকানের হিসাব', 'কার্ড সেলস', 'ক্যাশ টালি']
        : ['Morning Tally', 'Evening Tally', 'Daily Closing', 'Store Tally', 'Card Sales', 'Cash Tally'];
    }
    return combined.slice(0, 16);
  }, [recentSavedNames, savedTallies, isBn]);

  // Save cards to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('minute_card_list_custom_v3', JSON.stringify(minuteCards));
    } catch {
      // ignore
    }
  }, [minuteCards]);

  const currentDateHeader = formatHeaderDate(new Date(), isBn);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleApplyPreset = (name: string, mrp: number, rate: number) => {
    setNewCardName(name);
    setNewCardMrp(String(mrp));
    setNewCardRate(rate.toFixed(2));
    setNewCardStock('50');
  };

  // Calculations for Cash Notes
  const cashTotalAmount = cashNotes.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10);
    return sum + (!isNaN(qty) && qty > 0 ? qty * item.value : 0);
  }, 0);

  const cashTotalCount = cashNotes.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10);
    return sum + (!isNaN(qty) && qty > 0 ? qty : 0);
  }, 0);

  // Calculations for Minute Cards
  const minuteTotalAmount = minuteCards.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10);
    return sum + (!isNaN(qty) && qty > 0 ? qty * item.unitPrice : 0);
  }, 0);

  const minuteTotalMrp = minuteCards.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10);
    return sum + (!isNaN(qty) && qty > 0 ? qty * item.cardPrice : 0);
  }, 0);

  const minuteTotalCount = minuteCards.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10);
    return sum + (!isNaN(qty) && qty > 0 ? qty : 0);
  }, 0);

  const minuteTotalProfit = minuteTotalMrp - minuteTotalAmount;

  // Calculations for Minute Cards Stock Inventory
  const minuteTotalStock = useMemo(() => {
    return minuteCards.reduce((sum, item) => sum + (typeof item.stock === 'number' ? item.stock : 0), 0);
  }, [minuteCards]);

  const minuteTotalSold = useMemo(() => {
    return minuteCards.reduce((sum, item) => {
      const sold = parseInt(item.quantity, 10);
      return sum + (!isNaN(sold) && sold > 0 ? sold : 0);
    }, 0);
  }, [minuteCards]);

  const minuteStockValue = useMemo(() => {
    return minuteCards.reduce((sum, item) => {
      const stock = typeof item.stock === 'number' ? item.stock : 0;
      return sum + (stock * item.unitPrice);
    }, 0);
  }, [minuteCards]);

  // Stock handlers
  const handleOpenStockModal = (card: MinuteCardItem) => {
    setStockModalCard(card);
    setStockInputDelta('10');
    setStockMode('add');
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalCard) return;

    const numVal = parseInt(stockInputDelta, 10);
    if (isNaN(numVal) || numVal < 0) {
      showToast(isBn ? 'সঠিক স্টক সংখ্যা লিখুন' : 'Please enter valid stock number');
      return;
    }

    setMinuteCards((prev) =>
      prev.map((c) => {
        if (c.id === stockModalCard.id) {
          const currentStock = typeof c.stock === 'number' ? c.stock : 0;
          const newStock = stockMode === 'add' ? currentStock + numVal : numVal;
          return { ...c, stock: Math.max(0, newStock) };
        }
        return c;
      })
    );

    const cardDisplayName = getCardDisplayName(stockModalCard, isBn);
    showToast(
      stockMode === 'add'
        ? (isBn ? `"${cardDisplayName}" এ +${toBengaliNumerals(numVal)} টি স্টক যোগ হয়েছে! 📦` : `+${numVal} stock added to "${cardDisplayName}"! 📦`)
        : (isBn ? `"${cardDisplayName}" এর মোট স্টক ${toBengaliNumerals(numVal)} টি হয়েছে! 📦` : `Total stock set to ${numVal} for "${cardDisplayName}"! 📦`)
    );
    setStockModalCard(null);
  };

  // Active Total based on current mode
  const currentTotalAmount = mode === 'minute_card' ? minuteTotalAmount : cashTotalAmount;
  const currentTotalCount = mode === 'minute_card' ? minuteTotalCount : cashTotalCount;

  // Input Handlers
  const handleCashQuantityChange = (id: string, val: string) => {
    if (val === '' || /^\d+$/.test(val)) {
      setCashNotes((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: val } : item))
      );
    }
  };

  const handleMinuteQuantityChange = (id: string, val: string) => {
    if (val === '' || /^\d+$/.test(val)) {
      setMinuteCards((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: val } : item))
      );
    }
  };

  const handleMinuteQuickAdd = (id: string, delta: number) => {
    setMinuteCards((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const current = parseInt(item.quantity, 10);
          const next = Math.max(0, (isNaN(current) ? 0 : current) + delta);
          return { ...item, quantity: next > 0 ? String(next) : '' };
        }
        return item;
      })
    );
  };

  const handleMinuteSetPreset = (id: string, presetQty: number) => {
    setMinuteCards((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: String(presetQty) } : item
      )
    );
  };

  // Reset / Clear
  const handleClearAll = () => {
    if (mode === 'minute_card') {
      setMinuteCards((prev) => prev.map((item) => ({ ...item, quantity: '' })));
      showToast(isBn ? 'সকল মিনিট কার্ডের ইনপুট ক্লিয়ার হয়েছে' : 'All minute card inputs cleared');
    } else {
      setCashNotes((prev) => prev.map((item) => ({ ...item, quantity: '' })));
      showToast(isBn ? 'সকল নোটের ইনপুট ক্লিয়ার হয়েছে' : 'All cash note inputs cleared');
    }
  };

  // Open Save Modal with custom Name input
  const handleOpenSaveModal = () => {
    if (currentTotalAmount === 0 && currentTotalCount === 0) {
      showToast(isBn ? 'সেভ করার মতো কোনো হিসাব নেই!' : 'No calculation to save!');
      return;
    }
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const defaultName = mode === 'minute_card'
      ? (isBn ? `মিনিট কার্ড - ${timeNow}` : `Minute Card - ${timeNow}`)
      : (isBn ? `ক্যাশ টালি - ${timeNow}` : `Cash Tally - ${timeNow}`);
    setSaveTallyName(defaultName);
    setShowSaveModal(true);
  };

  // Confirm save to history
  const handleConfirmSaveTally = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackTitle = mode === 'minute_card' 
      ? (isBn ? 'মিনিট কার্ড সেলস' : 'Minute Card Sales')
      : (isBn ? 'ক্যাশ নোট টালি' : 'Cash Note Tally');
    const finalTitle = saveTallyName.trim() || fallbackTitle;
    const now = new Date();
    const autoDateStr = formatHeaderDate(now, isBn);
    const autoTimeStr = formatTimeOnly(now, isBn);

    const newTally: SavedTally = {
      id: Date.now().toString(),
      dateStr: autoDateStr,
      timeStr: autoTimeStr,
      timestamp: now.getTime(),
      mode,
      title: finalTitle,
      totalAmount: currentTotalAmount,
      totalCount: currentTotalCount,
      profit: mode === 'minute_card' ? minuteTotalProfit : undefined,
      breakdown: mode === 'minute_card' 
        ? minuteCards.filter(c => parseInt(c.quantity, 10) > 0).map(c => ({
            label: c.name || `${c.cardPrice} ৳ Card`,
            rate: c.unitPrice,
            qty: parseInt(c.quantity, 10),
            total: parseInt(c.quantity, 10) * c.unitPrice,
            mrp: c.cardPrice,
          }))
        : cashNotes.filter(n => parseInt(n.quantity, 10) > 0).map(n => ({
            label: n.label,
            rate: n.value,
            qty: parseInt(n.quantity, 10),
            total: parseInt(n.quantity, 10) * n.value
          }))
    };

    const updated = [newTally, ...savedTallies];
    setSavedTallies(updated);
    try {
      localStorage.setItem('minute_card_tallies', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (finalTitle) {
      setRecentSavedNames((prev) => {
        const nextList = [finalTitle, ...prev.filter((n) => n !== finalTitle)].slice(0, 20);
        try {
          localStorage.setItem('cash_counter_recent_names', JSON.stringify(nextList));
        } catch {
          // ignore
        }
        return nextList;
      });
    }

    // Deduct sold cards from stock when saving in minute_card mode
    if (mode === 'minute_card') {
      let totalSoldDeducted = 0;
      setMinuteCards((prev) =>
        prev.map((c) => {
          const soldQty = parseInt(c.quantity, 10);
          if (!isNaN(soldQty) && soldQty > 0) {
            totalSoldDeducted += soldQty;
            const currentStock = typeof c.stock === 'number' ? c.stock : 0;
            const newStock = Math.max(0, currentStock - soldQty);
            return {
              ...c,
              stock: newStock,
              quantity: '', // Clear input so user is ready for next sale
            };
          }
          return {
            ...c,
            quantity: '', // Clean input
          };
        })
      );

      setShowSaveModal(false);
      showToast(isBn 
        ? `"${finalTitle}" সেভ হয়েছে এবং স্টক থেকে ${toBengaliNumerals(totalSoldDeducted || currentTotalCount)} টি কার্ড বাদ গেছে! 📦💾` 
        : `"${finalTitle}" saved & ${totalSoldDeducted || currentTotalCount} cards deducted from stock! 📦💾`
      );
      return;
    }

    setShowSaveModal(false);
    showToast(isBn 
      ? `"${finalTitle}" (${autoTimeStr}) সফলভাবে সেভ হয়েছে! 💾` 
      : `"${finalTitle}" (${autoTimeStr}) saved successfully! 💾`
    );
  };

  // Share / Copy
  const handleShare = async () => {
    let summary = `📅 ${currentDateHeader}\n`;
    if (mode === 'minute_card') {
      summary += isBn ? `📱 মিনিট কার্ড সেলস সামারি:\n` : `📱 Minute Card Sales Summary:\n`;
      minuteCards.forEach((c) => {
        const qty = parseInt(c.quantity, 10);
        if (!isNaN(qty) && qty > 0) {
          const cardDisplayName = getCardDisplayName(c, isBn);
          if (isBn) {
            summary += `• ${cardDisplayName} (দর: ${toBengaliNumerals(c.unitPrice.toFixed(2))}) × ${toBengaliNumerals(qty)} পিস = ${toBengaliNumerals((qty * c.unitPrice).toFixed(2))} ৳\n`;
          } else {
            summary += `• ${cardDisplayName} (Rate: ${c.unitPrice.toFixed(2)}) × ${qty} pcs = ${(qty * c.unitPrice).toFixed(2)} ৳\n`;
          }
        }
      });
      summary += `--------------------------\n`;
      if (isBn) {
        summary += `মোট পিস: ${toBengaliNumerals(minuteTotalCount)} টি\n`;
        summary += `সর্বমোট বিল: ৳${toBengaliNumerals(minuteTotalAmount.toFixed(2))}/-\n`;
        summary += `মুদ্রিত মূল্য (MRP): ৳${toBengaliNumerals(minuteTotalMrp.toFixed(2))}/-\n`;
        summary += `মোট লাভ: ৳${toBengaliNumerals(minuteTotalProfit.toFixed(2))}/-\n`;
      } else {
        summary += `Total Pieces: ${minuteTotalCount} pcs\n`;
        summary += `Total Amount: ৳${minuteTotalAmount.toFixed(2)}/-\n`;
        summary += `Total MRP: ৳${minuteTotalMrp.toFixed(2)}/-\n`;
        summary += `Total Profit: ৳${minuteTotalProfit.toFixed(2)}/-\n`;
      }
    } else {
      summary += isBn ? `💵 ক্যাশ নোট টালি:\n` : `💵 Cash Note Tally:\n`;
      cashNotes.forEach((n) => {
        const qty = parseInt(n.quantity, 10);
        if (!isNaN(qty) && qty > 0) {
          const noteLabel = isBn ? toBengaliNumerals(n.label) : n.label;
          if (isBn) {
            summary += `• ${noteLabel} ${toBengaliNumerals(qty)} = ${toBengaliNumerals((qty * n.value).toLocaleString('en-IN'))} ৳\n`;
          } else {
            summary += `• ${noteLabel} ${qty} = ${(qty * n.value).toLocaleString('en-IN')} ৳\n`;
          }
        }
      });
      summary += `--------------------------\n`;
      if (isBn) {
        summary += `মোট নোট: ${toBengaliNumerals(cashTotalCount)} টি\n`;
        summary += `টাকা কথায়: ${numberToWords(cashTotalAmount, true)}\n`;
        summary += `সর্বমোট টাকা: ৳${toBengaliNumerals(cashTotalAmount.toLocaleString('en-IN'))}/-\n`;
      } else {
        summary += `Total Notes: ${cashTotalCount} notes\n`;
        summary += `In Words: ${numberToWords(cashTotalAmount, false)}\n`;
        summary += `Total Taka: ৳${cashTotalAmount.toLocaleString('en-IN')}/-\n`;
      }
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: isBn ? 'ক্যাশ ও মিনিট কার্ড হিসাব' : 'Cash & Minute Card Tally',
          text: summary,
        });
      } else {
        await navigator.clipboard.writeText(summary);
        showToast(isBn ? 'হিসাব কপি হয়েছে! পেস্ট করতে পারেন 📋' : 'Tally copied to clipboard! 📋');
      }
    } catch {
      await navigator.clipboard.writeText(summary);
      showToast(isBn ? 'হিসাব ক্লিপবোর্ডে কপি হয়েছে! 📋' : 'Tally copied to clipboard! 📋');
    }
  };

  // Helper to translate card names dynamically between English and Bengali
  function getCardDisplayName(card: MinuteCardItem, bengali: boolean): string {
    if (!bengali) {
      // English
      return card.name.replace(/টাকা/g, 'Tk').replace(/মিনিট কার্ড/g, 'Minute Card');
    } else {
      // Bengali
      const bDigits = toBengaliNumerals(card.cardPrice);
      if (card.name.includes('Minute Card') || card.name.includes('Tk')) {
        return `${bDigits} টাকা মিনিট কার্ড`;
      }
      return card.name;
    }
  }

  // Custom Card Addition
  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    const mrp = parseFloat(newCardMrp);
    const rate = parseFloat(newCardRate);
    const fallbackName = isBn ? `${toBengaliNumerals(mrp || 29)} টাকা মিনিট কার্ড` : `${mrp || 29} Tk Minute Card`;
    const name = newCardName.trim() || fallbackName;

    if (!mrp || mrp <= 0 || !rate || rate <= 0) {
      showToast(isBn ? 'দয়া করে সঠিক কার্ড মূল্য ও কেনা দর লিখুন' : 'Please enter valid card price and buying rate');
      return;
    }

    const stockNum = parseInt(newCardStock, 10);
    const validStock = !isNaN(stockNum) && stockNum >= 0 ? stockNum : 50;

    const newCard: MinuteCardItem = {
      id: `mc_${Date.now()}`,
      name: name,
      cardPrice: mrp,
      unitPrice: rate,
      quantity: '',
      stock: validStock,
    };

    setMinuteCards((prev) => [...prev, newCard]);
    setNewCardName('');
    setNewCardMrp('');
    setNewCardRate('');
    setNewCardStock('50');
    setShowAddCardModal(false);
    showToast(isBn ? `"${name}" (স্টক: ${toBengaliNumerals(validStock)} টি) যোগ করা হয়েছে!` : `"${name}" (Stock: ${validStock} pcs) added successfully!`);
  };

  // Open Edit Card Modal
  const handleOpenEditCard = (card: MinuteCardItem) => {
    setEditingCard(card);
    setEditNameValue(getCardDisplayName(card, isBn));
    setEditMrpValue(String(card.cardPrice));
    setEditRateValue(card.unitPrice.toFixed(2));
    setEditStockValue(String(typeof card.stock === 'number' ? card.stock : 50));
  };

  // Save Edited Card
  const handleSaveEditedCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    const mrp = parseFloat(editMrpValue);
    const rate = parseFloat(editRateValue);
    const stockNum = parseInt(editStockValue, 10);
    const validStock = !isNaN(stockNum) && stockNum >= 0 ? stockNum : (editingCard.stock ?? 50);
    const name = editNameValue.trim() || editingCard.name;

    if (!mrp || mrp <= 0 || !rate || rate <= 0) {
      showToast(isBn ? 'দয়া করে সঠিক মূল্য ও দর লিখুন' : 'Please enter valid price and rate');
      return;
    }

    setMinuteCards((prev) =>
      prev.map((c) =>
        c.id === editingCard.id
          ? { ...c, name: name, cardPrice: mrp, unitPrice: rate, stock: validStock }
          : c
      )
    );

    setEditingCard(null);
    showToast(isBn ? `"${name}" আপডেট করা হয়েছে!` : `"${name}" updated successfully!`);
  };

  // Delete Card
  const handleDeleteCard = (id: string, name: string) => {
    if (minuteCards.length <= 1) {
      showToast(isBn ? 'কমপক্ষে একটি কার্ড তালিকায় থাকতে হবে' : 'At least one card must remain in the list');
      return;
    }
    setMinuteCards((prev) => prev.filter((c) => c.id !== id));
    if (editingCard?.id === id) {
      setEditingCard(null);
    }
    showToast(isBn ? `"${name}" মুছে ফেলা হয়েছে` : `"${name}" deleted`);
  };

  // Load past tally
  const handleLoadTally = (tally: SavedTally) => {
    setMode(tally.mode);
    if (tally.mode === 'cash_notes') {
      setCashNotes((prev) =>
        prev.map((n) => {
          const found = tally.breakdown.find((b) => b.label === n.label);
          return { ...n, quantity: found ? String(found.qty) : '' };
        })
      );
    } else {
      setMinuteCards((prev) =>
        prev.map((c) => {
          const found = tally.breakdown.find(
            (b) => b.label === c.name || b.label.includes(`${c.cardPrice}`)
          );
          return { ...c, quantity: found ? String(found.qty) : '' };
        })
      );
    }
    setShowHistoryModal(false);
    setCurrentView(tally.mode);
    showToast(isBn ? 'সংরক্ষিত হিসাব লোড করা হয়েছে!' : 'Saved calculation loaded!');
  };

  const handleDeleteTally = (id: string) => {
    const updated = savedTallies.filter((t) => t.id !== id);
    setSavedTallies(updated);
    try {
      localStorage.setItem('minute_card_tallies', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast(isBn ? 'হিসাব ডিলিট করা হয়েছে' : 'Record deleted');
  };

  // Render language switcher pill
  const renderLanguagePill = () => (
    <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs shrink-0">
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
          isBn
            ? 'bg-emerald-600 text-white shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 active:bg-slate-200'
        }`}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
          !isBn
            ? 'bg-emerald-600 text-white shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 active:bg-slate-200'
        }`}
      >
        English
      </button>
    </div>
  );

  const renderHistoryContent = () => {
    const minuteCount = savedTallies.filter((t) => t.mode === 'minute_card' || (!t.mode && t.profit !== undefined)).length;
    const cashCount = savedTallies.filter((t) => t.mode === 'cash_notes' || (!t.mode && t.profit === undefined)).length;
    const totalCount = savedTallies.length;

    const filtered = savedTallies
      .filter((t) => {
        const isCard = t.mode === 'minute_card' || (!t.mode && t.profit !== undefined);
        const isCash = t.mode === 'cash_notes' || (!t.mode && t.profit === undefined);
        if (historyTab === 'minute_card') return isCard;
        if (historyTab === 'cash_notes') return isCash;
        return true;
      })
      .filter((t) => {
        if (!historySearchQuery.trim()) return true;
        const q = historySearchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.dateStr.toLowerCase().includes(q) ||
          (t.timeStr && t.timeStr.toLowerCase().includes(q))
        );
      });

    return (
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Category Segment Tabs */}
        <div className="shrink-0 pb-2">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
            {/* Minute Card History Tab */}
            <button
              type="button"
              onClick={() => setHistoryTab('minute_card')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-all ${
                historyTab === 'minute_card'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 active:bg-white/80'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isBn ? 'মিনিট কার্ড' : 'Minute Cards'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                historyTab === 'minute_card' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {isBn ? toBengaliNumerals(minuteCount) : minuteCount}
              </span>
            </button>

            {/* Cash Note History Tab */}
            <button
              type="button"
              onClick={() => setHistoryTab('cash_notes')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-all ${
                historyTab === 'cash_notes'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 active:bg-white/80'
              }`}
            >
              <Banknote className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isBn ? 'ক্যাশ নোট' : 'Cash Notes'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                historyTab === 'cash_notes' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {isBn ? toBengaliNumerals(cashCount) : cashCount}
              </span>
            </button>

            {/* All History Tab */}
            <button
              type="button"
              onClick={() => setHistoryTab('all')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-all ${
                historyTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 active:bg-white/80'
              }`}
            >
              <span>{isBn ? 'সব হিসাব' : 'All Records'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                historyTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {isBn ? toBengaliNumerals(totalCount) : totalCount}
              </span>
            </button>
          </div>
        </div>

        {/* Search filter in history */}
        {savedTallies.length > 0 && (
          <div className="shrink-0 pb-2">
            <input
              type="text"
              placeholder={
                isBn
                  ? (historyTab === 'minute_card'
                      ? 'মিনিট কার্ড হিসাবের নাম বা তারিখ খুঁজুন...'
                      : historyTab === 'cash_notes'
                      ? 'ক্যাশ নোট হিসাবের নাম বা তারিখ খুঁজুন...'
                      : 'নাম বা তারিখ দিয়ে হিসাব খুঁজুন...')
                  : (historyTab === 'minute_card'
                      ? 'Search minute card records by name or date...'
                      : historyTab === 'cash_notes'
                      ? 'Search cash note records by name or date...'
                      : 'Search records by name or date...')
              }
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>
        )}

        {/* History List */}
        <div className="flex-1 min-h-0 overflow-y-auto py-1 space-y-3 pr-0.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                {historyTab === 'minute_card' ? (
                  <CreditCard className="w-6 h-6" />
                ) : historyTab === 'cash_notes' ? (
                  <Banknote className="w-6 h-6" />
                ) : (
                  <History className="w-6 h-6" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                {isBn
                  ? (historyTab === 'minute_card'
                      ? 'কোনো মিনিট কার্ডের সংরক্ষিত হিসাব নেই'
                      : historyTab === 'cash_notes'
                      ? 'কোনো ক্যাশ নোটের সংরক্ষিত হিসাব নেই'
                      : 'কোনো সংরক্ষিত হিসাব পাওয়া যায়নি')
                  : (historyTab === 'minute_card'
                      ? 'No saved minute card records'
                      : historyTab === 'cash_notes'
                      ? 'No saved cash note records'
                      : 'No saved records found')}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-3">
                {isBn
                  ? 'হিসাব করার পর সেভ (💾) আইকন চেপে যেকোনো নাম দিয়ে সাথে সাথে সংরক্ষণ করতে পারেন।'
                  : 'After calculating, tap the save (💾) icon with any custom name to save immediately.'}
              </p>
              {currentView === 'history' && (
                <button
                  type="button"
                  onClick={() => setCurrentView('home')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isBn ? 'হোম পেজে ফিরে যান' : 'Back to Home'}</span>
                </button>
              )}
            </div>
          ) : (
            filtered.map((tally) => {
              const isCard = tally.mode === 'minute_card' || (!tally.mode && tally.profit !== undefined);
              const isCollapsed = Boolean(collapsedHistoryIds[tally.id]);

              return (
                <div 
                  key={tally.id}
                  className={`py-3 px-3 rounded-2xl mb-2.5 border transition-all ${
                    isCard 
                      ? 'bg-slate-50/80 border-slate-200/90 shadow-2xs hover:border-emerald-300' 
                      : 'bg-white border-slate-200/80 shadow-2xs hover:border-blue-300'
                  }`}
                >
                  {/* Breakdown / Item List */}
                  {tally.breakdown && tally.breakdown.length > 0 && (
                    <div>
                      {/* Toggle Header: Title, Date & Time */}
                      <button
                        type="button"
                        onClick={() => {
                          setCollapsedHistoryIds(prev => ({
                            ...prev,
                            [tally.id]: !isCollapsed
                          }));
                        }}
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-emerald-700 py-1 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2 flex-wrap">
                          {isCard ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              <CreditCard className="w-3 h-3" />
                              <span>{isBn ? 'মিনিট কার্ড' : 'Card'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                              <Banknote className="w-3 h-3" />
                              <span>{isBn ? 'ক্যাশ নোট' : 'Cash'}</span>
                            </span>
                          )}
                          <span className="font-extrabold text-slate-900 truncate text-xs sm:text-sm">
                            {tally.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium shrink-0 flex items-center gap-1.5">
                            <span>{tally.dateStr}</span>
                            <span>·</span>
                            <span className="font-mono text-emerald-700 font-semibold">
                              {tally.timeStr || (tally.timestamp ? new Date(tally.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '')}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center shrink-0 ml-auto pl-2 text-slate-400">
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Item List Content */}
                      {!isCollapsed && (
                        <div className="mt-1 py-1 text-[11px] space-y-1.5 animate-in fade-in duration-100">
                          {/* Denomination / Card items */}
                          <div className="space-y-1.5 py-0.5">
                            {tally.breakdown.map((item, idx) => {
                              const isNote = !isCard || item.label.includes('X');
                              const formattedRate = isBn ? toBengaliNumerals(item.rate.toFixed(2)) : item.rate.toFixed(2);
                              const formattedQty = isBn ? toBengaliNumerals(item.qty) : item.qty;
                              const formattedTotal = isBn ? toBengaliNumerals(item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              const itemLabel = isBn ? item.label.replace('Tk Minute Card', 'টাকা মিনিট কার্ড').replace('X', 'X') : item.label;

                              if (!isNote) {
                                const itemMrp = getMrpFromItem(item);
                                const itemTheme = getCardTheme(itemMrp);
                                const formattedMrp = isBn ? toBengaliNumerals(itemMrp) : itemMrp;

                                return (
                                  <div
                                    key={idx}
                                    className={`w-full ${itemTheme.bg} rounded-xl p-2.5 sm:p-3 text-white shadow-xs border ${itemTheme.border} relative overflow-hidden my-1`}
                                  >
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none" />
                                    <div className="flex items-center justify-between gap-2 relative z-10 flex-wrap">
                                      {/* Left: Card Name & MRP badge in exact same voucher style */}
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-extrabold text-white text-xs sm:text-sm font-sans truncate drop-shadow-2xs">
                                          {itemLabel}
                                        </span>
                                        <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md border ${itemTheme.badge} shrink-0`}>
                                          {isBn ? `এমআরপি ${formattedMrp} ৳` : `MRP ${itemMrp} Tk`}
                                        </span>
                                      </div>

                                      {/* Right: Rate × Qty = Total */}
                                      <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm shrink-0 ml-auto text-white">
                                        <span className="text-white/90">
                                          {formattedRate} ৳ × <strong className="font-bold text-white">{formattedQty}</strong>
                                        </span>
                                        <span className="text-white/60">=</span>
                                        <strong className="text-white font-black text-sm sm:text-base tabular-nums drop-shadow-2xs">
                                          ৳{formattedTotal}
                                        </strong>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-center py-0.5 text-center"
                                >
                                  <div className="flex items-center justify-center gap-1.5 font-mono text-xs sm:text-sm text-slate-800 whitespace-nowrap">
                                    <span className="font-semibold text-slate-700">
                                      {formattedRate} × {formattedQty}
                                    </span>
                                    <span className="text-slate-400 font-normal">=</span>
                                    <strong className="text-slate-900 font-black tracking-tight">
                                      ৳{formattedTotal}
                                    </strong>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Summary inside item list */}
                          <div className="pt-2 mt-1 space-y-2">
                            {/* Total Cards/Notes & Profit */}
                            <div className="flex items-center justify-between gap-2 py-0.5 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-700">
                                  {isCard 
                                    ? (isBn ? 'মোট কার্ড:' : 'Total Cards:') 
                                    : (isBn ? 'মোট নোট:' : 'Total Notes:')}
                                </span>
                                <span className="font-mono text-emerald-800 font-extrabold text-xs sm:text-sm">
                                  {isBn ? toBengaliNumerals(tally.totalCount) : tally.totalCount} {isCard ? (isBn ? 'টি' : 'cards') : (isBn ? 'টি' : 'notes')}
                                </span>
                              </div>

                              {/* Profit */}
                              {isCard && tally.profit !== undefined && (
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                  <span>{isBn ? 'মোট লাভ:' : 'Total Profit:'}</span>
                                  <span className="font-mono font-bold text-emerald-700">
                                    +{isBn ? `৳${toBengaliNumerals(tally.profit.toFixed(2))}/-` : `৳${tally.profit.toFixed(2)}/-`}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Taka In Words */}
                            <div className="py-0.5 text-[11px]">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                                {isBn ? 'টাকা কথায়:' : 'Taka In Words:'}
                              </span>
                              <span className="font-medium text-slate-800 italic leading-snug block font-sans">
                                {numberToWords(Math.round(tally.totalAmount), isBn)}
                              </span>
                            </div>

                            {/* Total Taka */}
                            <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 text-xs">
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                {isBn ? 'সর্বমোট টাকা:' : 'Total Taka:'}
                              </span>
                              <span className="font-mono text-emerald-700 font-black text-sm sm:text-base">
                                {isCard 
                                  ? (isBn ? `৳${toBengaliNumerals(tally.totalAmount.toFixed(2))}/-` : `৳${tally.totalAmount.toFixed(2)}/-`)
                                  : (isBn ? `৳${toBengaliNumerals(tally.totalAmount.toLocaleString('en-IN'))}/-` : `৳${tally.totalAmount.toLocaleString('en-IN')}/-`)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteTally(tally.id)}
                      className="h-8 px-2.5 text-xs font-semibold text-red-600 hover:text-red-700 active:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      <span>{isBn ? 'মুছে ফেলুন' : 'Delete'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadTally(tally)}
                      className="h-8 px-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <span>{isBn ? 'লোড করুন' : 'Load'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Developer Credit */}
        <div className="pt-2 text-center select-none shrink-0">
          <p className="text-[10px] text-slate-400 font-medium">
            {isBn ? 'অ্যাপটি তৈরি করেছেন: ROBIN' : 'App developed by: ROBIN'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white h-[100dvh] sm:h-[94vh] max-h-[100dvh] sm:max-h-[94vh] sm:rounded-3xl shadow-xl flex flex-col relative sm:border sm:border-slate-300 overflow-hidden">
      
      {/* 1. NOTIFICATION TOAST */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. VIEW: HOME PAGE */}
      {currentView === 'home' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/70">
          {/* Home Header */}
          <header className="shrink-0 bg-white border-b border-slate-200 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                  {isBn ? 'ক্যাশ ও কার্ড টালি খাতা' : 'Cash & Card Ledger'}
                </h1>
                <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{currentDateHeader}</span>
                </p>
              </div>
            </div>

            {renderLanguagePill()}
          </header>

          {/* Home Body: Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5">
            {/* Quick Hero Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 p-4 text-white shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block mb-1">
                  {isBn ? 'সহজ হিসাব খাতা' : 'EASY LEDGER'}
                </span>
                <h2 className="text-lg font-black tracking-tight leading-snug">
                  {isBn ? 'দৈনিক মিনিট কার্ড ও ক্যাশ হিসাব' : 'Daily Minute Card & Cash Tally'}
                </h2>
                <p className="text-xs text-emerald-100/90 mt-1 max-w-[280px] leading-relaxed">
                  {isBn 
                    ? 'নিচের অপশনগুলো থেকে মিনিট কার্ড ভাউচার, ক্যাশ নোট কাউন্টার বা পূর্বে সংরক্ষিত হিসাব নির্বাচন করুন।'
                    : 'Select Minute Card Vouchers, Cash Note Counter, or view Saved History below.'}
                </p>
              </div>
            </div>

            {/* 3 Main Menu Cards */}
            <div className="space-y-3">
              {/* Option 1: Minute Card */}
              <button
                type="button"
                onClick={() => {
                  setMode('minute_card');
                  setCurrentView('minute_card');
                }}
                className="w-full text-left bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-emerald-500/60 hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <CreditCard className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                    {isBn ? 'মিনিট কার্ড' : 'Minute Card'}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Option 2: Cash Note */}
              <button
                type="button"
                onClick={() => {
                  setMode('cash_notes');
                  setCurrentView('cash_notes');
                }}
                className="w-full text-left bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-blue-500/60 hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Banknote className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                    {isBn ? 'ক্যাশ নোট' : 'Cash Note'}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Option 3: History */}
              <button
                type="button"
                onClick={() => {
                  setPreviousView('home');
                  setCurrentView('history');
                }}
                className="w-full text-left bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-purple-500/60 hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <History className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                    {isBn ? 'সংরক্ষিত হিসাব' : 'Save History'}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>
          </div>

          {/* Home Footer pinned at the very bottom */}
          <footer className="shrink-0 bg-white border-t border-slate-200/80 py-2.5 px-4 text-center select-none pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xs">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-[11px] text-slate-500 font-medium shadow-2xs">
              <span>{isBn ? 'অ্যাপটি তৈরি করেছেন' : 'App developed by'}</span>
              <span className="font-bold text-slate-700 tracking-wider">ROBIN</span>
            </div>
          </footer>
        </div>
      )}

      {/* 3. VIEW: DEDICATED HISTORY PAGE */}
      {currentView === 'history' && (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <header className="shrink-0 bg-white border-b border-slate-200 px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                type="button" 
                onClick={() => setCurrentView(previousView || 'home')}
                className="w-10 h-10 -ml-1 flex items-center justify-center text-slate-800 hover:text-emerald-700 active:bg-slate-100 rounded-xl transition-colors"
                title={isBn ? 'ফিরে যান' : 'Back'}
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </button>
              
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
                  {isBn ? 'সংরক্ষিত হিসাব (হিস্ট্রি)' : 'Saved History (Records)'}
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">
                  {isBn ? `মোট ${toBengaliNumerals(savedTallies.length)} টি সংরক্ষিত হিসাব` : `Total ${savedTallies.length} saved records`}
                </p>
              </div>
            </div>

            {renderLanguagePill()}
          </header>

          <div className="flex-1 min-h-0 flex flex-col p-3.5 sm:p-5 overflow-hidden">
            {renderHistoryContent()}
          </div>
        </div>
      )}

      {/* 4. VIEW: CALCULATOR (Minute Card or Cash Note) */}
      {(currentView === 'minute_card' || currentView === 'cash_notes') && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* TOP BAR */}
          <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                type="button" 
                onClick={() => setCurrentView('home')}
                className="w-10 h-10 -ml-1 flex items-center justify-center text-slate-800 hover:text-emerald-700 active:bg-slate-100 rounded-xl transition-colors"
                title={isBn ? 'হোম পেজে ফিরুন' : 'Back to Home'}
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </button>
              
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight font-sans leading-tight">
                  {mode === 'minute_card' 
                    ? (isBn ? 'মিনিট কার্ড ভাউচার' : 'Minute Card Voucher') 
                    : (isBn ? 'ক্যাশ নোট কাউন্টার' : 'Cash Note Counter')}
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">
                  {currentDateHeader}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 text-slate-700">
              <button
                type="button"
                onClick={handleOpenSaveModal}
                className="w-10 h-10 flex items-center justify-center hover:text-emerald-700 active:bg-slate-100 rounded-xl transition-colors"
                title={isBn ? 'নাম দিয়ে হিসাব সেভ করুন' : 'Save calculation'}
              >
                <Save className="w-5 h-5 stroke-[2.2]" />
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="w-10 h-10 flex items-center justify-center hover:text-red-600 active:bg-red-50 rounded-xl transition-colors"
                title={isBn ? 'সব ক্লিয়ার করুন' : 'Clear all'}
              >
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </header>

          {/* SUB-HEADER & LANGUAGE SWITCHER */}
          <div className="shrink-0 px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-800 shadow-2xs">
              {mode === 'minute_card' ? (
                <>
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    {isBn ? 'মিনিট কার্ড' : 'Minute Card'}
                  </span>
                </>
              ) : (
                <>
                  <Banknote className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    {isBn ? 'ক্যাশ নোট' : 'Cash Notes'}
                  </span>
                </>
              )}
            </div>

            {renderLanguagePill()}
          </div>

          {/* MAIN BODY LIST */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2.5 pb-6 space-y-3.5">
            
            {/* A. MINUTE CARDS MODE */}
            {mode === 'minute_card' && (
              <>
                {/* Minute Card Stock & Inventory Summary Banner */}
                <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white rounded-2xl p-3 shadow-xs border border-emerald-600/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-yellow-300 shrink-0 shadow-2xs">
                      <Boxes className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider block">
                        {isBn ? 'কার্ড স্টক ইনভেন্টরি' : 'Card Stock & Inventory'}
                      </span>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold mt-0.5 flex-wrap">
                        <span>
                          {isBn ? 'মোট স্টক:' : 'Total Stock:'}{' '}
                          <strong className="font-mono text-yellow-300">
                            {isBn ? toBengaliNumerals(minuteTotalStock) : minuteTotalStock} {isBn ? 'টি' : 'pcs'}
                          </strong>
                        </span>
                        {minuteTotalSold > 0 && (
                          <>
                            <span className="text-emerald-400">·</span>
                            <span className="text-rose-200 font-bold flex items-center gap-1">
                              <span>{isBn ? 'স্টক থেকে সেল:' : 'Sold from stock:'}</span>
                              <strong className="font-mono text-white bg-rose-600/70 px-1.5 py-0.5 rounded text-xs shadow-2xs">
                                −{isBn ? toBengaliNumerals(minuteTotalSold) : minuteTotalSold} {isBn ? 'টি' : 'pcs'}
                              </strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-200 block">
                      {isBn ? 'স্টক ইনভেস্ট:' : 'Stock Value:'}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold font-mono text-white">
                      {isBn ? `৳${toBengaliNumerals(minuteStockValue.toFixed(2))}/-` : `৳${minuteStockValue.toFixed(2)}/-`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1">
                  <span className="font-bold text-slate-800">
                    {isBn 
                      ? `মিনিট কার্ড ভাউচার লিস্ট (${toBengaliNumerals(minuteCards.length)})` 
                      : `Minute Card Voucher List (${minuteCards.length})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCardName('');
                      setNewCardMrp('');
                      setNewCardRate('');
                      setNewCardStock('50');
                      setShowAddCardModal(true);
                    }}
                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isBn ? '+ কার্ড যোগ করুন' : '+ Add Card'}</span>
                  </button>
                </div>

                {/* List of Cards styled as Real Voucher Cards */}
                {minuteCards.map((card) => {
                  const qty = parseInt(card.quantity, 10);
                  const validQty = !isNaN(qty) && qty > 0 ? qty : 0;
                  const cardStock = typeof card.stock === 'number' ? card.stock : 0;
                  const subtotal = validQty * card.unitPrice;
                  const theme = getCardTheme(card.cardPrice);
                  const cardDisplayName = getCardDisplayName(card, isBn);
                  const formattedMrp = isBn ? toBengaliNumerals(card.cardPrice) : card.cardPrice;
                  const formattedRate = isBn ? toBengaliNumerals(card.unitPrice.toFixed(2)) : card.unitPrice.toFixed(2);
                  const profitAmt = (card.cardPrice - card.unitPrice) * validQty;

                  return (
                    <div 
                      key={card.id} 
                      className="rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm transition-all overflow-hidden"
                    >
                      {/* CARD VOUCHER HEADER */}
                      <div className={`${theme.bg} p-3 sm:p-3.5 text-white relative overflow-hidden`}>
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                        <div className="flex items-center justify-between gap-2 mt-1">
                          <div className="min-w-0 flex-1">
                            <h2 className="text-base sm:text-xl font-extrabold tracking-tight text-white drop-shadow-xs truncate font-sans">
                              {cardDisplayName}
                            </h2>
                            <div className="flex items-center gap-2 text-xs text-white/90 mt-0.5 flex-wrap">
                              <span>
                                {isBn ? 'মুদ্রিত মূল্য:' : 'MRP:'} <strong className="font-bold font-mono text-white">{formattedMrp} ৳</strong>
                              </span>
                              <span>·</span>
                              <span>
                                {isBn ? 'কেনা দর:' : 'Rate:'} <strong className="font-bold font-mono text-yellow-200">{formattedRate} ৳</strong>
                              </span>
                            </div>

                            {/* Stock Display with Live Minus Calculation */}
                            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/20">
                              {/* Main Stock Badge showing live minus inside the badge */}
                              {validQty > 0 ? (
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-2xs transition-all ${
                                  cardStock - validQty < 0
                                    ? 'bg-red-950/85 text-white border-red-400'
                                    : 'bg-black/35 text-white border-white/25'
                                }`}>
                                  <Boxes className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                                  <span>{isBn ? 'স্টক:' : 'Stock:'}</span>
                                  <span className="font-mono text-white/90 font-medium">
                                    {isBn ? toBengaliNumerals(cardStock) : cardStock}
                                  </span>
                                  <span className="font-mono font-bold text-rose-300 bg-rose-950/80 px-1 py-0.5 rounded border border-rose-500/40">
                                    −{isBn ? toBengaliNumerals(validQty) : validQty}
                                  </span>
                                  <span className="text-white/60 font-bold">=</span>
                                  <strong className={`font-mono font-extrabold ${cardStock - validQty < 0 ? 'text-red-300 animate-pulse' : 'text-yellow-300'}`}>
                                    {isBn ? toBengaliNumerals(cardStock - validQty) : cardStock - validQty} {isBn ? 'টি' : 'pcs'}
                                  </strong>
                                  {cardStock - validQty < 0 && (
                                    <span className="text-[10px] bg-red-600 text-white font-bold px-1 rounded ml-0.5">
                                      {isBn ? 'ঘাটতি' : 'Short'}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/25 text-white text-xs font-semibold border border-white/20 shadow-2xs">
                                  <Boxes className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                                  <span>{isBn ? 'স্টক:' : 'Stock:'}</span>
                                  <strong className="font-mono text-yellow-300 font-bold">
                                    {isBn ? toBengaliNumerals(cardStock) : cardStock} {isBn ? 'টি' : 'pcs'}
                                  </strong>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right badge & edit action */}
                          <div className="flex flex-col items-end gap-1 shrink-0 self-start">
                            <span className={`text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md border ${theme.badge}`}>
                              {isBn ? `এমআরপি ${formattedMrp} ৳` : `MRP ${card.cardPrice} Tk`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditCard(card)}
                              className="text-[11px] text-white/90 hover:text-white underline flex items-center gap-0.5 pt-0.5 p-1 active:opacity-75"
                              title={isBn ? 'কার্ডের নাম, রেট ও স্টক পরিবর্তন' : 'Edit card & stock'}
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{isBn ? 'এডিট' : 'Edit'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* CALCULATION ROW: Quantity Input × = Subtotal */}
                      <div className="p-2.5 sm:p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                        
                        {/* Quantity Input with - and + steppers */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-slate-600 hidden sm:inline mr-1">
                            {isBn ? 'পরিমাণ:' : 'Quantity:'}
                          </span>
                          <div className="flex items-center rounded-xl bg-white border border-slate-300 shadow-2xs overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleMinuteQuickAdd(card.id, -1)}
                              disabled={validQty <= 0}
                              aria-label="Decrease"
                              className="h-11 w-10 sm:w-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              autoComplete="off"
                              value={card.quantity}
                              onChange={(e) => handleMinuteQuantityChange(card.id, e.target.value)}
                              placeholder={isBn ? 'কত পিস' : 'Pcs'}
                              className="w-18 sm:w-24 h-11 text-center text-base sm:text-lg font-bold font-mono text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:text-xs"
                            />

                            <button
                              type="button"
                              onClick={() => handleMinuteQuickAdd(card.id, 1)}
                              aria-label="Increase"
                              className="h-11 w-10 sm:w-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Equal Symbol "=" */}
                        <div className="text-base sm:text-lg font-bold text-slate-400 select-none">
                          =
                        </div>

                        {/* Subtotal Display */}
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            {isBn ? 'সাবটোটাল' : 'SUBTOTAL'}
                          </span>
                          <span className="text-base sm:text-xl font-extrabold font-mono text-slate-900 tabular-nums">
                            {isBn 
                              ? `${toBengaliNumerals(subtotal.toFixed(2))} ৳` 
                              : `${subtotal.toFixed(2)} ৳`}
                          </span>
                        </div>

                      </div>

                      {/* QUICK QUANTITY PRESETS CHIPS */}
                      <div className="px-3 pb-2.5 pt-1.5 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100/80 gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 text-xs">{isBn ? 'দ্রুত:' : 'Quick:'}</span>
                          {[5, 10, 20, 50, 100].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleMinuteSetPreset(card.id, preset)}
                              className={`min-w-8 h-7 px-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center ${
                                validQty === preset
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                              }`}
                            >
                              {isBn ? toBengaliNumerals(preset) : preset}
                            </button>
                          ))}
                        </div>

                        {validQty > 0 && (
                          <span className="text-emerald-700 font-semibold text-[11px] ml-auto">
                            {isBn 
                              ? `লাভ: +${toBengaliNumerals(profitAmt.toFixed(2))} ৳`
                              : `Profit: +${profitAmt.toFixed(2)} ৳`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* B. CASH NOTES MODE */}
            {mode === 'cash_notes' && (
              <div className="divide-y divide-slate-100">
                {cashNotes.map((note) => {
                  const qty = parseInt(note.quantity, 10);
                  const validQty = !isNaN(qty) && qty > 0 ? qty : 0;
                  const subtotal = validQty * note.value;
                  const noteLabel = isBn ? toBengaliNumerals(note.label) : note.label;

                  return (
                    <div key={note.id} className="py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
                      {/* Left: 1000X, 500X, etc. */}
                      <div className="w-18 sm:w-28 shrink-0">
                        <span className="text-base sm:text-xl font-bold font-mono tracking-tight text-slate-900">
                          {noteLabel}
                        </span>
                      </div>

                      {/* Middle: Rounded border input box */}
                      <div className="flex-1 max-w-[125px] sm:max-w-[140px]">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="off"
                          value={note.quantity}
                          onChange={(e) => handleCashQuantityChange(note.id, e.target.value)}
                          placeholder="0"
                          className="w-full h-11 px-2 sm:px-3 text-center text-lg sm:text-xl font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 active:border-emerald-600"
                        />
                      </div>

                      {/* Symbol "=" */}
                      <div className="text-base sm:text-xl font-bold text-slate-400 select-none shrink-0 px-1">
                        =
                      </div>

                      {/* Right: Subtotal */}
                      <div className="w-22 sm:w-28 shrink-0 text-right font-mono font-bold text-base sm:text-xl text-slate-900 tabular-nums">
                        {isBn 
                          ? toBengaliNumerals(subtotal.toLocaleString('en-IN')) 
                          : subtotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Discreet Developer Credit */}
            <div className="pt-3 pb-2 text-center select-none opacity-60">
              <span className="text-[10px] text-slate-400 font-medium">
                {isBn ? 'অ্যাপটি তৈরি করেছেন: ROBIN' : 'Developed by: ROBIN'}
              </span>
            </div>

          </div>

          {/* 5. BOTTOM BAR WITH MODERN EYE-FRIENDLY COLOR THEME */}
          <footer className={`shrink-0 w-full z-30 transition-colors pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-3xl ${footerThemeStyles.wrapper}`}>
            
            {/* Expandable Details Drawer */}
            {isDetailsExpanded && (
              <div className={`px-4 sm:px-5 py-3.5 border-b text-xs space-y-2 animate-in slide-in-from-bottom-2 duration-150 ${footerThemeStyles.drawer}`}>
                <div className="flex items-center justify-between">
                  <span className={footerThemeStyles.drawerLabel}>
                    {mode === 'minute_card' 
                      ? (isBn ? '( মোট কার্ড সংখ্যা ):' : '( Total Cards Count ):')
                      : (isBn ? '( মোট নোট সংখ্যা ):' : '( Total Notes Count ):')}
                  </span>
                  <span className={`font-bold text-sm ${footerThemeStyles.drawerValue}`}>
                    {isBn ? toBengaliNumerals(currentTotalCount) : currentTotalCount} {mode === 'minute_card' ? (isBn ? 'টি' : 'cards') : (isBn ? 'টি' : 'notes')}
                  </span>
                </div>

                {mode === 'minute_card' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className={footerThemeStyles.drawerLabel}>
                        {isBn ? 'মুদ্রিত মোট বিক্রয় মূল্য (MRP):' : 'Total MRP Sale Value:'}
                      </span>
                      <span className={`font-bold text-sm ${footerThemeStyles.drawerValue}`}>
                        {formatTakaDecimal(minuteTotalMrp, { showBengali: isBn })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={footerThemeStyles.drawerLabel}>
                        {isBn ? 'মোট নিট লাভ (Total Profit):' : 'Net Total Profit:'}
                      </span>
                      <span className={`font-bold text-sm ${footerThemeStyles.drawerProfit}`}>
                        +{formatTakaDecimal(minuteTotalProfit, { showBengali: isBn })}
                      </span>
                    </div>
                  </>
                )}

                <div className={`pt-1.5 border-t ${footerThemeStyles.drawerDivider}`}>
                  <span className={`text-[11px] block ${footerThemeStyles.inWordsLabel}`}>
                    {isBn ? 'টাকা কথায় (In Words):' : 'Taka In Words:'}
                  </span>
                  <span className={`font-medium text-xs italic ${footerThemeStyles.inWordsValue}`}>
                    {numberToWords(Math.round(currentTotalAmount), isBn)}
                  </span>
                </div>
              </div>
            )}

            <div className="px-4 sm:px-5 pt-1.5 pb-2 sm:py-2.5">
              {/* Top Line of Bottom Bar: Items count badge on Left, Action buttons on Right */}
              <div className="flex items-center justify-between pb-1">
                {/* Count Badge */}
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${footerThemeStyles.countBadge}`}>
                    {mode === 'minute_card'
                      ? (isBn ? `${toBengaliNumerals(currentTotalCount)} টি কার্ড` : `${currentTotalCount} Cards`)
                      : (isBn ? `${toBengaliNumerals(currentTotalCount)} টি নোট` : `${currentTotalCount} Notes`)}
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* Theme Switcher Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = footerTheme === 'slate' ? 'emerald' : footerTheme === 'emerald' ? 'navy' : 'slate';
                      setFooterTheme(next);
                      setToastMessage(
                        next === 'slate' 
                          ? (isBn ? 'কালার: ডার্ক স্লেট' : 'Color: Dark Slate')
                          : next === 'emerald'
                          ? (isBn ? 'কালার: ডিপ এমারেল্ড' : 'Color: Deep Emerald')
                          : (isBn ? 'কালার: রয়্যাল নেভি' : 'Color: Royal Navy')
                      );
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${footerThemeStyles.actionBtn}`}
                    title={isBn ? 'কালার পরিবর্তন করুন' : 'Change theme color'}
                    aria-label="Change theme color"
                  >
                    <Palette className="w-4 h-4 stroke-[2.2]" />
                  </button>

                  {/* Chevron to toggle details */}
                  <button
                    type="button"
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${footerThemeStyles.actionBtn}`}
                    title={isBn ? 'বিস্তারিত দেখুন' : 'View details'}
                    aria-label="Toggle details"
                  >
                    {isDetailsExpanded ? (
                      <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </button>

                  {/* History button */}
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryTab(mode);
                      setPreviousView(mode);
                      setCurrentView('history');
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${footerThemeStyles.actionBtn}`}
                    title={isBn ? 'পূর্বের সেভ করা হিসাব' : 'Saved history'}
                    aria-label="View history"
                  >
                    <History className="w-4 h-4 stroke-[2.2]" />
                  </button>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${footerThemeStyles.actionBtn}`}
                    title={isBn ? 'শেয়ার / কপি করুন' : 'Share / Copy'}
                    aria-label="Share tally"
                  >
                    <Share2 className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>
              </div>

              {/* MAIN DISPLAY: Total Taka Amount */}
              <div className={`flex items-baseline justify-between gap-2 pt-1 border-t ${footerThemeStyles.borderDivider}`}>
                <span className={`text-sm sm:text-base font-bold whitespace-nowrap ${footerThemeStyles.totalLabel}`}>
                  {isBn ? 'সর্বমোট টাকা:' : 'Total Taka:'}
                </span>
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight select-all drop-shadow-xs ${footerThemeStyles.totalAmount}`}>
                  {mode === 'minute_card'
                    ? formatTakaDecimal(currentTotalAmount, { showBengali: isBn })
                    : formatTakaSlash(currentTotalAmount, { showBengali: isBn })}
                </span>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* MODAL: ADD NEW CARD */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm sm:max-w-md w-full p-5 shadow-2xl border-t sm:border border-slate-200 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[max(1.25rem,env(safe-area-inset-bottom))] my-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isBn ? 'নতুন কার্ড যোগ করুন' : 'Add New Card'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddCardModal(false)}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-3">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                {isBn ? 'রেডিমেড কার্ড সিলেক্ট করুন:' : 'Select Ready Card:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: isBn ? '২৯ টাকা মিনিট কার্ড' : '29 Tk Minute Card', mrp: 29, rate: 28.30 },
                  { name: isBn ? '১৯ টাকা মিনিট কার্ড' : '19 Tk Minute Card', mrp: 19, rate: 18.50 },
                  { name: isBn ? '৪৯ টাকা মিনিট কার্ড' : '49 Tk Minute Card', mrp: 49, rate: 47.80 },
                  { name: isBn ? '৯৯ টাকা মিনিট কার্ড' : '99 Tk Minute Card', mrp: 99, rate: 96.50 },
                ].map((item) => (
                  <button
                    key={item.mrp}
                    type="button"
                    onClick={() => handleApplyPreset(item.name, item.mrp, item.rate)}
                    className="text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 active:bg-emerald-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddCustomCard} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'কার্ডের নাম *' : 'Card Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: ২৯ টাকা মিনিট কার্ড' : 'e.g. 29 Tk Minute Card'}
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full h-11 px-3 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'কার্ড মূল্য (MRP ৳) *' : 'Card MRP (৳) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="29"
                    value={newCardMrp}
                    onChange={(e) => setNewCardMrp(e.target.value)}
                    className="w-full h-11 px-2.5 text-sm font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'কেনা দর (Rate ৳) *' : 'Buying Rate (৳) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="28.30"
                    value={newCardRate}
                    onChange={(e) => setNewCardRate(e.target.value)}
                    className="w-full h-11 px-2.5 text-sm font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'শুরুর স্টক (Pcs) *' : 'Stock (Pcs) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="50"
                    value={newCardStock}
                    onChange={(e) => setNewCardStock(e.target.value)}
                    className="w-full h-11 px-2.5 text-sm font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="h-11 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-xl"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-11 px-5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs"
                >
                  {isBn ? 'কার্ড যোগ করুন' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CARD */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm sm:max-w-md w-full p-5 shadow-2xl border-t sm:border border-slate-200 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[max(1.25rem,env(safe-area-inset-bottom))] my-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isBn ? 'কার্ড এডিট করুন' : 'Edit Card'}
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingCard(null)}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCard} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'কার্ডের নাম' : 'Card Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="w-full h-11 px-3 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'কার্ড মূল্য (MRP)' : 'Card MRP'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editMrpValue}
                    onChange={(e) => setEditMrpValue(e.target.value)}
                    className="w-full h-11 px-2.5 text-sm font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'কেনা দর (Rate)' : 'Buying Rate'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editRateValue}
                    onChange={(e) => setEditRateValue(e.target.value)}
                    className="w-full h-11 px-2.5 text-sm font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'মোট স্টক (Pcs)' : 'Stock (Pcs)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStockValue}
                    onChange={(e) => setEditStockValue(e.target.value)}
                    className="w-full h-11 px-2.5 text-sm font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteCard(editingCard.id, editingCard.name)}
                  className="inline-flex items-center gap-1.5 h-11 px-3 text-xs text-red-600 hover:text-red-700 active:bg-red-50 font-semibold rounded-xl"
                >
                  <Trash className="w-4 h-4" />
                  <span>{isBn ? 'মুছে ফেলুন' : 'Delete'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="h-11 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-xl"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="h-11 px-5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs"
                  >
                    {isBn ? 'সেভ করুন' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD & MANAGE STOCK INSIDE MINUTE CARD */}
      {stockModalCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-5 shadow-2xl border-t sm:border border-slate-200 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[max(1.25rem,env(safe-area-inset-bottom))] my-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
                  <Boxes className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {isBn ? 'কার্ডে স্টক যোগ করুন' : 'Add Stock to Card'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {getCardDisplayName(stockModalCard, isBn)}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setStockModalCard(null)}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stock Banner */}
            <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200/80 mb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-900 block">
                  {isBn ? 'বর্তমান স্টক:' : 'Current Stock:'}
                </span>
                <span className="text-2xl font-black font-mono text-amber-900">
                  {isBn 
                    ? `${toBengaliNumerals(typeof stockModalCard.stock === 'number' ? stockModalCard.stock : 0)} টি` 
                    : `${typeof stockModalCard.stock === 'number' ? stockModalCard.stock : 0} pcs`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-amber-800 block">
                  {isBn ? 'মুদ্রিত দর:' : 'MRP:'} {stockModalCard.cardPrice} ৳
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  {isBn ? 'কেনা দর:' : 'Rate:'} {stockModalCard.unitPrice.toFixed(2)} ৳
                </span>
              </div>
            </div>

            {/* Mode Switch: Add to Stock vs Set Total Stock */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setStockMode('add')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  stockMode === 'add'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isBn ? '+ নতুন স্টক যোগ' : '+ Add to Stock'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockMode('set');
                  setStockInputDelta(String(typeof stockModalCard.stock === 'number' ? stockModalCard.stock : 0));
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  stockMode === 'set'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isBn ? 'মোট স্টক পরিবর্তন' : 'Set Total Stock'}
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-3">
              {stockMode === 'add' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isBn ? 'কত পিস স্টক যোগ করবেন? *' : 'How many pieces to add? *'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={stockInputDelta}
                      onChange={(e) => setStockInputDelta(e.target.value)}
                      placeholder="10"
                      className="w-full h-12 px-3 text-xl font-bold font-mono text-center border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Quick Add Chips */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      {isBn ? 'দ্রুত পিস যোগ করুন:' : 'Quick Add Chips:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[5, 10, 20, 25, 50, 100].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setStockInputDelta(String(chip))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            stockInputDelta === String(chip)
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          +{isBn ? toBengaliNumerals(chip) : chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs text-emerald-900 flex items-center justify-between">
                    <span>{isBn ? 'নতুন মোট স্টক হবে:' : 'New Total Stock:'}</span>
                    <strong className="text-sm font-bold font-mono text-emerald-800">
                      {isBn 
                        ? `${toBengaliNumerals(((typeof stockModalCard.stock === 'number' ? stockModalCard.stock : 0) + (parseInt(stockInputDelta, 10) || 0)))} টি` 
                        : `${((typeof stockModalCard.stock === 'number' ? stockModalCard.stock : 0) + (parseInt(stockInputDelta, 10) || 0))} pcs`}
                    </strong>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'মোট স্টক সংখ্যা দিন *' : 'Enter Total Stock *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockInputDelta}
                    onChange={(e) => setStockInputDelta(e.target.value)}
                    placeholder="50"
                    className="w-full h-12 px-3 text-xl font-bold font-mono text-center border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModalCard(null)}
                  className="h-11 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-xl"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-11 px-5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isBn ? 'স্টক সেভ করুন' : 'Save Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SAVE CALCULATION WITH CUSTOM NAME */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-5 shadow-2xl border-t sm:border border-slate-200 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[max(1.25rem,env(safe-area-inset-bottom))] my-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Save className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {isBn ? 'হিসাব সংরক্ষণ করুন' : 'Save Calculation'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSaveModal(false)}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    {mode === 'minute_card' 
                      ? (isBn ? 'মোট কার্ড:' : 'Total Cards:') 
                      : (isBn ? 'মোট নোট:' : 'Total Notes:')}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-800 font-mono">
                    {isBn ? toBengaliNumerals(currentTotalCount) : currentTotalCount} {mode === 'minute_card' ? (isBn ? 'টি' : 'cards') : (isBn ? 'টি' : 'notes')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium block">
                    {isBn ? 'মোট টাকা:' : 'Total Taka:'}
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono text-emerald-700">
                    {mode === 'minute_card'
                      ? formatTakaDecimal(currentTotalAmount, { showBengali: isBn })
                      : formatTakaSlash(currentTotalAmount, { showBengali: isBn })}
                  </span>
                </div>
              </div>
              {/* Automatic Date & Time Indicator */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBn ? 'তারিখ:' : 'Date:'} <strong>{currentDateHeader}</strong></span>
                </span>
                <span className="flex items-center gap-1 font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>{isBn ? 'অটো টাইম সেভ' : 'Auto Time'}</span>
                </span>
              </div>

              {/* Stock Deduction Notice for Minute Card */}
              {mode === 'minute_card' && currentTotalCount > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-lg font-medium mt-1">
                  <Boxes className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    {isBn 
                      ? `সেভ করলে বিক্রিত ${toBengaliNumerals(currentTotalCount)} টি কার্ড স্বয়ংক্রিয়ভাবে স্টক থেকে বাদ যাবে।` 
                      : `Saving will automatically deduct ${currentTotalCount} sold cards from stock.`}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmSaveTally} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'হিসাবের নাম দিন (Input Name) *' : 'Calculation Name (Input Name) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: রহিম স্টোর / সকালের হিসাব' : 'e.g. Rahim Store / Morning Tally'}
                  value={saveTallyName}
                  onChange={(e) => setSaveTallyName(e.target.value)}
                  className="w-full h-11 px-3 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  {isBn ? 'দ্রুত সাজেশন:' : 'Quick Suggestions:'}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  {dynamicSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setSaveTallyName(sug)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg transition-all font-semibold border ${
                        saveTallyName === sug
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white hover:bg-emerald-50 active:bg-emerald-100 hover:text-emerald-800 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-3">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="h-11 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-xl"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-11 px-5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isBn ? 'নাম দিয়ে সেভ করুন' : 'Save Calculation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SAVED HISTORY */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full h-[88vh] sm:h-[80vh] max-h-[92vh] sm:max-h-[85vh] flex flex-col p-4 sm:p-5 shadow-2xl border-t sm:border border-slate-200 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 sm:hidden" />

            <div className="shrink-0 flex items-center justify-end pb-1">
              <button 
                type="button" 
                onClick={() => setShowHistoryModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderHistoryContent()}

          </div>
        </div>
      )}

    </div>
  );
};
