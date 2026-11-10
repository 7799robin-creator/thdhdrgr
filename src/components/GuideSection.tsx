import React from 'react';
import { HelpCircle, Calculator, CheckCircle2, ShieldCheck } from 'lucide-react';

export const GuideSection: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-bold text-slate-900">
          মিনিট কার্ড ক্যালকুলেটর ব্যবহারের নিয়ম ও তথ্য
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>১. স্বয়ংক্রিয় গণনা পদ্ধতি</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            মোট বিল হিসাবের সূত্র: <strong>ইউনিট দর (Unit Price) × পরিমাণ (Quantity) = সর্বমোট বিল (Total)</strong>।
            যেকোনো সংখ্যা পরিবর্তনের সাথে সাথেই মোট টাকা তৎক্ষণাৎ আপডেট হয়।
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>২. উদাহরণ (Standard Example)</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1 font-mono">
            <div>• প্রোডাক্ট: Minute Card</div>
            <div>• কার্ড মূল্য (MRP): 29 ৳</div>
            <div>• ইউনিট দর: 28.30 ৳</div>
            <div>• পরিমাণ: 10 পিস</div>
            <div className="text-emerald-700 font-bold">• মোট: 283.00 ৳</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>৩. ইনপুট সুরক্ষা ও বৈধতা</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            ঋণাত্মক সংখ্যা বা ভুল ইনপুট প্রবেশ রোধ করা হয়েছে। দ্রুত সিলেক্টের জন্য ৫, ১০, ২০, ৫০ ও ১০০ পিসের বাটন রয়েছে।
          </p>
        </div>
      </div>
    </div>
  );
};
