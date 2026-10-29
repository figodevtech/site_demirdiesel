import { getCheckoutPolicy } from '@/lib/erp-checkout-policy';
import { automaticShippingEnabled } from '@/lib/melhor-envio-oauth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { quoteShipping,ShippingQuoteError,freeShippingOption,SHIPPING_UNAVAILABLE_MESSAGE } from '@/lib/shipping-quote';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({cep:z.string().regex(/^\d{8}$/),items:z.array(z.object({productId:z.number().int().positive(),quantity:z.number().int().min(1).max(999)})).min(1).max(100)});
export async function POST(request:Request){
 const body=schema.safeParse(await request.json().catch(()=>null));
 if(!body.success)return NextResponse.json({message:'Confira o CEP e os itens do carrinho.'},{status:422});
 try{
 const config=await getCheckoutPolicy(body.data.items.map(item=>item.productId));
 if(!config.available)return NextResponse.json({message:SHIPPING_UNAVAILABLE_MESSAGE},{status:503});
 if(body.data.items.every(item=>config.policies[String(item.productId)]?.freeShipping===true))return NextResponse.json({options:[freeShippingOption()],environment:null,quotedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 if(!await automaticShippingEnabled())return NextResponse.json({options:[],manual:true,environment:null,quotedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 return NextResponse.json(await quoteShipping(body.data.cep,body.data.items),{headers:{'Cache-Control':'no-store'}});}
 catch(error){if(error instanceof ShippingQuoteError&&error.publicMessage!==error.message)console.warn('[shipping/quote]',{message:error.message,status:error.status});return NextResponse.json({message:error instanceof ShippingQuoteError?error.publicMessage:SHIPPING_UNAVAILABLE_MESSAGE},{status:error instanceof ShippingQuoteError?error.status:503});}
}
