/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CashCounter } from './components/CashCounter';

export default function App() {
  return (
    <main className="h-[100dvh] sm:h-auto sm:min-h-screen bg-slate-200/70 sm:py-3 flex flex-col justify-center items-center selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden sm:overflow-auto">
      <CashCounter />
    </main>
  );
}
