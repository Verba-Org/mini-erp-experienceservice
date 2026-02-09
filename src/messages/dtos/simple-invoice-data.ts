export interface SimpleInvoiceData {
  invoice_number: string;
  created_date: string;
  due_date: string;
  customer_name: string;
  customer_email: string;
  subtotal_amount: number;
  tax_amount: number;
  tax_summary: string;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  currency: string;
  total_amount: number;
}
