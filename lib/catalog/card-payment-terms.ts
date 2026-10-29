import 'server-only';
import { getCheckoutPolicy } from '@/lib/erp-checkout-policy';
import { getCardFees } from '@/lib/asaas-fees';
import { bestCardPaymentQuote,type CardPaymentQuote } from '@/lib/card-payment-quote';
import type { CheckoutPolicy,CardFees } from '@/lib/checkout-policy';
import type { CardPaymentPolicy } from '@/lib/card-payment-policies';

export async function getProductPaymentPolicy(id:number):Promise<CardPaymentPolicy|null>{
 try{
  const config=await getCheckoutPolicy([id]);
  const policy=config.policies[String(id)];
  if(!config.available||!policy)return null;
  let fees:CardFees|null=null;
  if(policy.feeMode!=='absorbed'){try{fees=await getCardFees();}catch{/* Keep absorbed installments available when fees fail. */}}
  return {policy,fees};
 }catch{return null;}
}

export async function withCardPaymentTerms<T extends {id:string|number}>(products:T[],getPrice:(product:T)=>number):Promise<(T&{cardPaymentTerms:CardPaymentQuote|null})[]>{
 const missing=products.filter(product=>!('cardPaymentTerms' in product)&&getPrice(product)>0);
 const ids=[...new Set(missing.map(product=>Number(product.id)))].filter(id=>Number.isInteger(id)&&id>0&&id<=2147483647);
 const policies:Record<string,CheckoutPolicy>={};
 try{
  const batches=[];for(let offset=0;offset<ids.length;offset+=100)batches.push(ids.slice(offset,offset+100));
  const configs=await Promise.all(batches.map(batch=>getCheckoutPolicy(batch)));
  for(const config of configs)if(config.available)Object.assign(policies,config.policies);
 }catch{/* An unavailable policy never prevents the catalog from rendering. */}
 let fees:CardFees|null=null;
 if(Object.values(policies).some(policy=>policy.feeMode!=='absorbed')){
  try{fees=await getCardFees();}catch{/* Only products requiring fees lose the simulation. */}
 }
 return products.map(product=>{
  if('cardPaymentTerms' in product)return product as T&{cardPaymentTerms:CardPaymentQuote|null};
  const policy=policies[String(product.id)],price=getPrice(product);
  return {...product,cardPaymentTerms:policy&&price>0?bestCardPaymentQuote(price,policy,fees):null};
 });
}
