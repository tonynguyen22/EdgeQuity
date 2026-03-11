export interface InsiderTransaction {
  transactionDate?: string;
  filingDate?: string;
  name?: string;
  transactionCode?: string;
  change?: number;
  share?: number;
  transactionPrice?: number;
  isDerivative?: boolean;
}

export interface Institution {
  name?: string;
  share?: number;
  ownershipPercent?: number;
  change?: number;
  reportDate?: string;
}

export interface InsiderData {
  transactions: InsiderTransaction[];
  institutions: Institution[];
  sentiment: any[];
}

export interface BuyerCluster {
  month: string;
  count: number;
}

export interface NetBuySell {
  buy: number;
  sell: number;
}
