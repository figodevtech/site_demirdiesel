import { checkoutPolicySchema,type CheckoutPolicy,type CardFees } from './checkout-policy';

export type CardPaymentPolicy={policy:CheckoutPolicy;fees:CardFees|null};
const cache=new Map<number,{value:CardPaymentPolicy;expires:number}>();
const pending=new Map<number,{started:boolean;promise:Promise<CardPaymentPolicy|null>;resolve:(value:CardPaymentPolicy|null)=>void}>();
let timer:ReturnType<typeof setTimeout>|undefined;
function cardFees(value:unknown):CardFees|null{
 if(!value||typeof value!=='object')return null;
 const fees=value as CardFees;
 if(['operationValue','one','six','twelve'].some(key=>typeof fees[key as keyof CardFees]!=='number'||!Number.isFinite(fees[key as keyof CardFees])||fees[key as keyof CardFees]<0))return null;
 if([fees.one,fees.six,fees.twelve].some(rate=>rate>=100))return null;
 return {operationValue:fees.operationValue,one:fees.one,six:fees.six,twelve:fees.twelve};
}
async function flush(){
 timer=undefined;
 const entries=[...pending.entries()].filter(([,request])=>!request.started);
 for(const [,request] of entries)request.started=true;
 // A card mounting during an in-flight request reuses that same promise.
 for(let offset=0;offset<entries.length;offset+=100){
  const batch=entries.slice(offset,offset+100);
  let data:{available?:boolean;policies?:Record<string,unknown>;fees?:unknown}|null=null;
  try{
   const response=await fetch(`/api/checkout/options?ids=${batch.map(([id])=>id).join(',')}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(response.ok)data=await response.json();
  }catch{/* Display a neutral fallback; checkout always revalidates. */}
  for(const [id,request] of batch){
   const parsed=checkoutPolicySchema.safeParse(data?.policies?.[String(id)]);
   const value=data?.available===true&&parsed.success?{policy:parsed.data,fees:cardFees(data.fees)}:null;
   if(value){if(cache.size>=500)cache.delete(cache.keys().next().value!);cache.set(id,{value,expires:Date.now()+30000});}
   request.resolve(value);pending.delete(id);
  }
 }
}
export function loadCardPaymentPolicy(id:number):Promise<CardPaymentPolicy|null>{
 if(!Number.isInteger(id)||id<=0||id>2147483647)return Promise.resolve(null);
 const cached=cache.get(id);if(cached&&cached.expires>Date.now())return Promise.resolve(cached.value);
 const existing=pending.get(id);if(existing)return existing.promise;
 let resolve!:(value:CardPaymentPolicy|null)=>void;
 const promise=new Promise<CardPaymentPolicy|null>(done=>{resolve=done;});
 pending.set(id,{promise,resolve,started:false});
 if(timer===undefined)timer=setTimeout(()=>void flush(),30);
 return promise;
}
