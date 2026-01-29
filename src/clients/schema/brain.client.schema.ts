
export class LineItem {
    product_name : string ;
    product_quantity : number ;
    unit_price : number ;
    currency: string ;
}

export class BrainClientSchema {
    intent : "CREATE_SALES_ORDER" |  "CREATE_FULLFILLMENT" | "CHECK_INVENTORY" | "RECORD_PAYMENT" | "CREATE_INVOICE" |"UNKNOWN" ;
    party_name? : string ;
    due_date? : string ;
    line_items? : LineItem[] ;
    summary?: string ;  

}