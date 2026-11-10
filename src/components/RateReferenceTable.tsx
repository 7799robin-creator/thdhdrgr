import React from 'react';
import { formatTaka } from '../utils/formatters';

interface RateReferenceTableProps {
  cardPrice: number;
  unitPrice: number;
  onSelectQuantity: (qty: number) => void;
}

export const RateReferenceTable: React.FC<RateReferenceTableProps> = ({
  cardPrice,
  unitPrice,
  onSelectQuantity,
}) => {
  const commonTiers = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 100, 200];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            দর তালিকা ও রেডি টেবিল (Quick Rate Sheet)
          </h3>
          <p className="text-xs text-slate-500">
            কার্ড রেট: <strong className="text-slate-800">{unitPrice.toFixed(2)} ৳</strong> (মুদ্রিত মূল্য: {cardPrice} ৳)
          </p>
        </div>
        <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-100 self-start sm:self-auto">
          যেকোনো সারিতে ক্লিক করে ক্যালকুলেটরে বসান
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/70">
              <th className="py-2.5 px-3">পরিমাণ (Pcs)</th>
              <th className="py-2.5 px-3">ক্রয় / বিল মূল্য ({unitPrice.toFixed(2)} ৳)</th>
              <th className="py-2.5 px-3">খুচরা মূল্য ({cardPrice} ৳ MRP)</th>
              <th className="py-2.5 px-3">লাভ / মার্জিন</th>
              <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
            {commonTiers.map((qty) => {
              const cost = qty * unitPrice;
              const mrp = qty * cardPrice;
              const profit = mrp - cost;
              return (
                <tr 
                  key={qty} 
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => onSelectQuantity(qty)}
                >
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {qty} পিস
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {formatTaka(cost)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {formatTaka(mrp)}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-600 font-semibold">
                    +{profit.toFixed(2)} ৳
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectQuantity(qty);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                    >
                      হিসাব করুন
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
