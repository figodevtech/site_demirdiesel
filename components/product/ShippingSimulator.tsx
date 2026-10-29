"use client";
import { useEffect,useId,useState } from 'react';
import { Loader2,Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';
import type { ShippingOption } from '@/lib/shipping-quote';
type Item={productId:number;quantity:number};
type Result={options:ShippingOption[];quotedAt:string;environment:string|null;manual?:boolean};
export function useShippingQuote(cep:string,items:Item[],enabled=true){
 const key=JSON.stringify([cep.replace(/\D/g,''),items.map(i=>[i.productId,i.quantity]).sort((a,b)=>a[0]-b[0])]);
 const [state,setState]=useState<{key:string;result?:Result;error?:string}>({key:''});
 const [selected,setSelected]=useState<{key:string;id:number}|null>(null);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  const [digits,entries]=JSON.parse(key) as [string,number[][]];
  if(!enabled||digits.length!==8||!entries.length)return()=>controller.abort();
  const timer=setTimeout(()=>{
   void fetch('/api/shipping/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cep:digits,items:entries.map(([productId,quantity])=>({productId,quantity}))}),signal:controller.signal})
    .then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.message);return body as Result;})
    .then(result=>{if(!controller.signal.aborted)setState({key,result});})
    .catch(error=>{if(!controller.signal.aborted)setState({key,error:error instanceof Error?error.message:'Não foi possível consultar o frete.'});});
  },350);
  return()=>{clearTimeout(timer);controller.abort();};
 },[key,enabled,retry]);
 const current=state.key===key?state:undefined;
 const option=enabled&&selected?.key===key?current?.result?.options.find(o=>o.id===selected.id):undefined;
 return {result:current?.result,error:current?.error,busy:enabled&&cep.replace(/\D/g,'').length===8&&!current,option,select:(id:number)=>setSelected({key,id}),refresh:()=>{setSelected(null);setState({key:''});setRetry(n=>n+1);}};
}
export function ShippingChoices({quote,disabled=false,compact=false}:{quote:ReturnType<typeof useShippingQuote>;disabled?:boolean;compact?:boolean}){
 return <div className={compact?"space-y-2":"space-y-3"}>
 {(quote.busy||quote.error)&&<div role="status" className={compact?"flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground":"text-sm text-muted-foreground"}><span>{quote.busy?'Calculando frete…':quote.error}</span>{compact&&quote.error&&<Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={disabled} onClick={quote.refresh}>Tentar novamente</Button>}</div>}
 {quote.result?.manual&&<p className={compact?"text-xs text-muted-foreground":"text-sm text-muted-foreground"}>Frete a combinar com a loja. O envio não está incluído no pagamento dos produtos; solicite uma cotação antes de comprar.</p>}
 {!compact&&quote.error&&<Button type="button" variant="outline" size="sm" disabled={disabled} onClick={quote.refresh}>Tentar novamente</Button>}
 {quote.result&&<><RadioGroup aria-label="Serviço de entrega" disabled={disabled} value={quote.option?String(quote.option.id):''} onValueChange={id=>quote.select(Number(id))}>{quote.result.options.map(option=><Label key={option.id} htmlFor={`shipping-service-${option.id}`} className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border ${compact?'p-2.5 text-sm':'p-3'}`}><RadioGroupItem id={`shipping-service-${option.id}`} value={String(option.id)}/><span className="min-w-0 flex-1"><span className="block font-medium">{option.merchantSelected?option.name:<>{option.company} · {option.name}</>}</span><span className="text-xs text-muted-foreground">{option.merchantSelected?'A loja escolhe o serviço e informa o prazo de envio.':`Prazo estimado: ${option.days} dias úteis após postagem`}</span></span><span className="shrink-0 tabular-nums">{option.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></Label>)}</RadioGroup>{quote.result.environment==='sandbox'&&<p className="text-xs text-muted-foreground">Cotação de teste, sem validade para postagem.</p>}</>}
 </div>;
}
export function ShippingSimulator({initialCep='',productIds,items}:{initialCep?:string;productIds:number[];items?:Item[]}){
 const cepId=useId();
 const [cep,setCep]=useState(initialCep),[destination,setDestination]=useState('');
 const quote=useShippingQuote(destination,items||productIds.map(productId=>({productId,quantity:1})));
 return <section className="space-y-3 border-t border-border/70 py-4" aria-label="Calcular frete">
  <h3 className="flex items-center gap-2 text-sm font-medium"><Truck className="size-4 text-muted-foreground" aria-hidden="true"/>Calcular frete</h3>
  <form className="flex max-w-sm items-center gap-2" onSubmit={event=>{event.preventDefault();if(quote.busy||cep.replace(/\D/g,'').length!==8)return;setDestination(cep.replace(/\D/g,''));quote.refresh();}}>
   <Label htmlFor={cepId} className="sr-only">CEP de destino</Label>
   <Input id={cepId} className="h-9 min-w-0 flex-1 bg-background text-sm" inputMode="numeric" autoComplete="postal-code" maxLength={9} placeholder="Digite seu CEP" value={cep} onChange={event=>{const digits=event.target.value.replace(/\D/g,'').slice(0,8);setCep(digits.length>5?`${digits.slice(0,5)}-${digits.slice(5)}`:digits);setDestination('');}}/>
   <Button type="submit" variant="secondary" size="sm" className="h-9 shrink-0 gap-1.5 px-4 text-xs font-medium" disabled={quote.busy||cep.replace(/\D/g,'').length!==8}>{quote.busy&&<Loader2 className="size-3.5 animate-spin" aria-hidden="true"/>}{quote.busy?'Calculando':'Calcular'}</Button>
  </form>
  {quote.error&&<p role="status" className="text-xs text-muted-foreground">{quote.error}</p>}
  {quote.result?.manual&&<p className="text-xs text-muted-foreground">Frete a combinar com a loja.</p>}
  {Boolean(quote.result?.options.length)&&<ul className="max-w-sm divide-y divide-border/60">{quote.result!.options.map(option=><li key={option.id} className="flex min-w-0 items-center justify-between gap-3 py-2 text-xs"><div className="min-w-0"><p className="font-medium">{option.merchantSelected?option.name:`${option.company} · ${option.name}`}</p><p className="mt-0.5 text-muted-foreground">{option.merchantSelected?'Envio por conta da loja':`${option.days} dias úteis após postagem`}</p></div><span className="shrink-0 font-medium tabular-nums">{option.price===0?'Grátis':option.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></li>)}</ul>}
  {quote.result?.environment==='sandbox'&&<p className="text-xs text-muted-foreground">Cotação de teste.</p>}
 </section>;
}
