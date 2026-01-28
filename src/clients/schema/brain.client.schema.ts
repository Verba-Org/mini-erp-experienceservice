
export class LineItem {
    product_name : string ;
    product_quantity : number ;
    unit_price : number ;
    currency: string ;
}

export class BrainClientSchema {
    intent : "CREATE_SALE" |  "LOG_PURCHASE" | "CHECK_INVENTORY" | "CREATE_INVOICE" | "UNKNOWN" ;
    party_name? : string ;
    line_items? : LineItem[] ;
    summary?: string ;  

}