export interface MinuteCardItem {
  id: string;
  name: string;
  cardPrice: number; // MRP e.g. 29
  unitPrice: number; // Wholesale/buying rate e.g. 28.30
  quantity: string;  // input string
  stock?: number;    // Available inventory/stock in pieces
}

export interface CashNoteItem {
  id: string;
  label: string;     // e.g. "1000X", "500X"
  value: number;     // numeric face value
  quantity: string;  // input string
}

export interface SavedTally {
  id: string;
  dateStr: string;
  timeStr: string;
  timestamp: number;
  mode: 'minute_card' | 'cash_notes';
  title: string;
  totalAmount: number;
  totalCount: number;
  profit?: number;
  breakdown: Array<{
    label: string;
    rate: number;
    qty: number;
    total: number;
    mrp?: number;
  }>;
}
