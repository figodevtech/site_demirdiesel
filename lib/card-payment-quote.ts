import { installmentQuote,type CheckoutPolicy,type CardFees } from './checkout-policy';
export type CardPaymentQuote={count:number;installment:number;total:number;interest:number};
export function bestCardPaymentQuote(price:number,policy:CheckoutPolicy,fees:CardFees|null):CardPaymentQuote|null{
 let best:CardPaymentQuote|null=null;
 for(let count=1;count<=policy.maxInstallments;count++){
  try{const quote=installmentQuote(price,count,policy,fees);best={count:quote.count,installment:quote.installment,total:quote.total,interest:quote.interest};}catch{/* Minimum installment or current fees unavailable. */}
 }
 return best;
}
