export class LineItem {
  product_name: string;
  product_quantity: number;
  unit_price: number;
  currency: string;
}

export class BrainClientSchema {
  intent:
    | 'CREATE_SALES_ORDER'
    | 'CREATE_FULLFILLMENT'
    | 'CHECK_INVENTORY'
    | 'RECORD_PAYMENT'
    | 'CREATE_INVOICE'
    | 'STATUS_CHECK'
    | 'UNKNOWN';

  //   used to check inventory by product name
  target_product_name?: string;

  party_name?: string;
  order_number?: string;
  customer_payment_amount?: number;
  due_date?: string;
  line_items?: LineItem[];
  summary?: string;
}
