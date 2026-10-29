"use client";
import { useEffect,useState } from 'react';
import { loadCardPaymentPolicy,type CardPaymentPolicy } from '@/lib/card-payment-policies';
import { bestCardPaymentQuote,type CardPaymentQuote } from '@/lib/card-payment-quote';

const money=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export function ProductCardPaymentTerms({productId,price,initialQuote}:{productId:number;price:number;initialQuote?:CardPaymentQuote|null}){
 const [state,setState]=useState<{id:number;value:CardPaymentPolicy|null}|null>(null);
 useEffect(()=>{
  if(!(price>0)||initialQuote!==undefined)return;
  let active=true;
  void loadCardPaymentPolicy(productId).then(value=>{if(active)setState({id:productId,value});});
  return()=>{active=false;};
 },[productId,price,initialQuote]);
 if(!(price>0))return null;
 const current=state?.id===productId?state:undefined;
 const best=initialQuote!==undefined?initialQuote:current?.value?bestCardPaymentQuote(price,current.value.policy,current.value.fees):null;
 if(initialQuote===undefined&&!current)return <div className="mt-1 min-h-8" aria-hidden="true"/>;
 return <div className="mt-1 min-h-8 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
  {!best?<p>Consulte as condições no produto.</p>:<>
   <p>{best.count>1?'Até ':''}<span className="font-medium text-foreground">{best.count}x de {money(best.installment)}</span>{best.interest?' com acréscimo':' sem acréscimo'}</p>
   {best.interest>0&&<p>Total no cartão: {money(best.total)}</p>}
  </>}
 </div>;
}
