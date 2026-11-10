import React, { useState, useId } from 'react';
import { 
  RotateCcw, 
  Copy, 
  Check, 
  Plus, 
  Minus,
  Sparkles,
  Info
} from 'lucide-react';
import { toBengaliNumerals } from '../utils/formatters';

interface MinuteCardCalculatorProps {
  cardPrice?: number;
  initialUnitPrice?: number;
  externalQuantity?: number | null;
  onCalculationChange?: (result: {
    unitPrice: number;
    quantity: number;
    total: number;
    profit: number;
  }) => void;
}

export const MinuteCardCalculator: React.FC<MinuteCardCalculatorProps> = ({
  cardPrice = 29,
  initialUnitPrice = 28.3,
  externalQuantity = null,
  onCalculationChange,
}) => {
  const unitPriceId = useId();
  const quantityId = useId();

  // Unit price string state for seamless typing
  const [unitPriceInput, setUnitPriceInput] = useState<string>(initialUnitPrice.toFixed(2));
  // Quantity string state (allowing empty placeholder state)
  const [quantityInput, setQuantityInput] = useState<string>(
    externalQuantity !== null ? String(externalQuantity) : '10'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [showBengali, setShowBengali] = useState<boolean>(false);

  // Sync external quantity if parent passes it
  React.useEffect(() => {
    if (externalQuantity !== null && externalQuantity !== undefined) {
      setQuantityInput(String(externalQuantity));
    }
  }, [externalQuantity]);

  // Parse values safely
  const parsedUnitPrice = parseFloat(unitPriceInput);
  const parsedQuantity = parseInt(quantityInput, 10);

  const isUnitPriceValid = !isNaN(parsedUnitPrice) && parsedUnitPrice >= 0;
  const isQuantityValid = !isNaN(parsedQuantity) && parsedQuantity >= 0;

  const validUnitPrice = isUnitPriceValid ? parsedUnitPrice : 0;
  const validQuantity = isQuantityValid ? parsedQuantity : 0;

  // Real-time calculation: unit price × quantity
  const total = validUnitPrice * validQuantity;
  const totalMrp = cardPrice * validQuantity;
  const profit = totalMrp - total;

  React.useEffect(() => {
    if (onCalculationChange && isUnitPriceValid && isQuantityValid) {
      onCalculationChange({
        unitPrice: validUnitPrice,
        quantity: validQuantity,
        total,
        profit,
      });
    }
  }, [validUnitPrice, validQuantity, total, profit, isUnitPriceValid, isQuantityValid, onCalculationChange]);

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setUnitPriceInput(val);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setQuantityInput(val);
    }
  };

  const handleQuickAddQuantity = (delta: number) => {
    const current = isNaN(parsedQuantity) ? 0 : parsedQuantity;
    const next = Math.max(0, current + delta);
    setQuantityInput(String(next));
  };

  const handleSetPresetQuantity = (qty: number) => {
    setQuantityInput(String(qty));
  };

  const handleReset = () => {
    setUnitPriceInput(initialUnitPrice.toFixed(2));
    setQuantityInput('10');
  };

  const handleCopySummary = async () => {
    const summaryText = `Minute Card (${cardPrice} ৳)\nদর: ${validUnitPrice.toFixed(2)} ৳ × পরিমাণ: ${validQuantity} পিস\nমোট মূল্য: ${total.toFixed(2)} ৳${validQuantity > 0 ? ` (লাভ: ${profit.toFixed(2)} ৳)` : ''}`;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3">
      {/* Top Mini Bar */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">Minute Card Calculator</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-medium">মিনিট কার্ড সেলস ক্যালকুলেটর</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBengali(!showBengali)}
            className="text-slate-600 hover:text-emerald-700 font-medium transition-colors"
          >
            {showBengali ? 'English (123)' : 'বাংলা সংখ্যা (১২৩)'}
          </button>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-600 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {/* Main Green Voucher Card - Matches User Screenshot & Puts Everything Side-by-Side (পাশাপাশি) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#007a4d] text-white shadow-lg border border-emerald-400/30 p-4 sm:p-5 md:p-6 transition-all">
        
        {/* Subtle radial sheen like the screenshot */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-white/10 to-transparent pointer-events-none rounded-full blur-2xl" />

        {/* 1. TOP HEADER (Directly from User Screenshot) */}
        <div className="flex items-center justify-between border-b border-emerald-400/25 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-200 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-400/20 font-medium">
              Minute Card
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0b8054]/90 border border-emerald-300/40 text-white px-3 py-1 rounded-lg text-xs sm:text-sm font-bold tracking-wide shadow-xs">
              MRP {cardPrice} Tk
            </div>
          </div>
        </div>

        {/* 2. MAIN ROW: EVERYTHING SIDE-BY-SIDE (সব হবে পাশাপাশি) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
          
          {/* Section 1: Fixed Card Price (কার্ডের মুদ্রিত মূল্য: 29 ৳) */}
          <div className="md:col-span-3 flex md:flex-col justify-between items-center md:items-start border-b md:border-b-0 md:border-r border-emerald-400/20 pb-3 md:pb-0 md:pr-4">
            <div>
              <span className="text-xs sm:text-sm text-emerald-100 font-normal block font-sans">
                কার্ডের মুদ্রিত মূল্য
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white tabular-nums">
                  {showBengali ? toBengaliNumerals(cardPrice) : cardPrice} ৳
                </span>
              </div>
            </div>

            <div className="md:mt-1">
              <span className="text-[11px] text-emerald-200/90 font-medium">
                ফিক্সড রেট (Fixed)
              </span>
            </div>
          </div>

          {/* Section 2: Unit Price Input (default: 28.30) */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-1">
              <label 
                htmlFor={unitPriceId} 
                className="block text-xs font-semibold text-emerald-100"
              >
                দর (Unit Price)
              </label>
              <span className="text-[10px] text-emerald-200">ডিফল্ট: 28.30</span>
            </div>
            
            <div className="relative">
              <input
                id={unitPriceId}
                type="text"
                inputMode="decimal"
                value={unitPriceInput}
                onChange={handleUnitPriceChange}
                placeholder="28.30"
                className={`w-full h-12 px-3.5 pr-8 text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 bg-white rounded-xl shadow-xs border transition-all ${
                  !isUnitPriceValid
                    ? 'border-red-400 ring-2 ring-red-400 text-red-900'
                    : 'border-white focus:outline-none focus:ring-2 focus:ring-emerald-300'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                ৳
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-200">
              <span>পাইকারি রেট</span>
              {unitPriceInput !== '28.30' && (
                <button
                  type="button"
                  onClick={() => setUnitPriceInput('28.30')}
                  className="underline hover:text-white font-medium"
                >
                  28.30 করুন
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Multiplication Sign "×" */}
          <div className="hidden md:flex md:col-span-1 items-center justify-center pt-2">
            <div className="w-9 h-9 rounded-full bg-emerald-900/40 border border-emerald-300/30 flex items-center justify-center font-bold text-xl text-emerald-100 select-none shadow-xs">
              ×
            </div>
          </div>

          {/* Section 4: Quantity Input with Placeholder "কত পিস" */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label 
                htmlFor={quantityId} 
                className="block text-xs font-semibold text-emerald-100"
              >
                পরিমাণ (Quantity)
              </label>
              <span className="text-[10px] text-emerald-200">কত পিস</span>
            </div>

            <div className="flex items-center rounded-xl bg-white shadow-xs overflow-hidden border border-white">
              {/* Tap Decrement */}
              <button
                type="button"
                onClick={() => handleQuickAddQuantity(-1)}
                disabled={validQuantity <= 0}
                aria-label="Decrease quantity"
                className="h-12 w-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Input with placeholder "কত পিস" */}
              <input
                id={quantityId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantityInput}
                onChange={handleQuantityChange}
                placeholder="কত পিস"
                className="w-full h-12 text-center text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:text-sm placeholder:font-normal"
              />

              {/* Tap Increment */}
              <button
                type="button"
                onClick={() => handleQuickAddQuantity(1)}
                aria-label="Increase quantity"
                className="h-12 w-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-200">
              <span>পিস সংখ্যা</span>
              {quantityInput !== '' && (
                <button
                  type="button"
                  onClick={() => setQuantityInput('')}
                  className="underline hover:text-white"
                >
                  ক্লিয়ার
                </button>
              )}
            </div>
          </div>

          {/* Section 5: Total Amount in Bangladeshi Taka (৳) */}
          <div className="md:col-span-3 bg-emerald-950/50 rounded-xl p-3 sm:p-3.5 border border-emerald-300/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                মোট বিল (Total)
              </span>
              <span className="text-[11px] text-emerald-200 font-mono">
                {validUnitPrice.toFixed(2)} × {validQuantity}
              </span>
            </div>

            <div className="my-1">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-white tabular-nums">
                {showBengali 
                  ? `${toBengaliNumerals(total.toFixed(2))} ৳` 
                  : `${total.toFixed(2)} ৳`}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-emerald-200 pt-1.5 border-t border-emerald-400/20">
              <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                লাভ: {profit > 0 ? `+${profit.toFixed(2)} ৳` : `${profit.toFixed(2)} ৳`}
              </span>
              <button
                type="button"
                onClick={handleCopySummary}
                className="hover:text-white underline font-semibold text-[11px] transition-colors"
              >
                {copied ? 'কপি হয়েছে!' : 'কপি করুন'}
              </button>
            </div>
          </div>

        </div>

        {/* 3. BOTTOM PRESET BAR & ACTIONS (Compact & Short) */}
        <div className="mt-4 pt-3 border-t border-emerald-400/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-emerald-200 text-xs mr-1 font-medium">দ্রুত পিস:</span>
            {[5, 10, 20, 25, 50, 100].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => handleSetPresetQuantity(qty)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  parsedQuantity === qty
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'bg-emerald-900/50 hover:bg-emerald-800 text-white border border-emerald-400/30'
                }`}
              >
                {qty}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>কপি হিসাব</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>
          </div>
        </div>

      </div>

      {/* Clean, short summary text */}
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-slate-600 shadow-xs">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            <strong>{validQuantity}</strong> পিস Minute Card × <strong>{validUnitPrice.toFixed(2)} ৳</strong> = <strong className="text-slate-900">{total.toFixed(2)} ৳</strong>
          </span>
        </div>
        <div className="text-emerald-700 font-semibold sm:text-right">
          মুদ্রিত বিক্রয় মূল্য (MRP): {(validQuantity * cardPrice).toFixed(2)} ৳ · মোট লাভ: +{profit.toFixed(2)} ৳
        </div>
      </div>
    </div>
  );
};
