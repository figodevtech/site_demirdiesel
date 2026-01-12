import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { services, testimonials } from "@/lib/data";
import { buscarProdutos } from "@/lib/api";
import { ArrowRight, Star, Truck, ShieldCheck, CreditCard } from 'lucide-react';
import { BannerCarousel } from "@/components/home/BannerCarousel";

function FeatureIcon({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-white shadow-sm border border-border/50">
      <div className="p-3 rounded-full bg-accent/30 text-primary">
        <Icon size={24} />
      </div>
      <div>
        <h4 className="font-semibold text-secondary text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground ">{desc}</p>
      </div>
    </div>
  );
}

export default async function Home() {
  const featuredProducts = await buscarProdutos(8);

  return (
    <div className="flex flex-col gap-12 pb-12">

      {/* Hero Section */}
      <BannerCarousel />

      {/* Features Bar */}
      <div className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureIcon icon={Truck} title="Frete para todo Brasil" desc="Consulte condições de envio" />
          <FeatureIcon icon={ShieldCheck} title="Garantia Estendida" desc="Em peças e serviços" />
          <FeatureIcon icon={CreditCard} title="Parcele em até 12x" desc="Cartões de crédito" />
        </div>
      </div>

      {/* Services Section */}
      <section className="container mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-secondary">Nossos Serviços</h2>
          <p className="text-muted-foreground">Soluções completas para manutenção do seu veículo</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {services.map((service, idx) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow border-border/60 hover:border-primary/50 group cursor-pointer bg-white">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4 h-full">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  {/* Placeholder Icon based on ID/Name or just generic */}
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary">{service.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2">{service.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Destaques da Loja</h2>
              <p className="text-muted-foreground">Os produtos mais procurados da semana</p>
            </div>
            <Link href="/categoria/todos">
              <Button variant="link" className="text-primary">Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/produto/${product.id}`}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 group border-border/50 bg-white overflow-hidden">
                  <div className="aspect-square relative bg-white flex items-center justify-center p-4">
                    <div className="w-full h-full bg-gray-100 rounded-md relative overflow-hidden">
                      <img src={product.image} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />

                      <div className="absolute bottom-2 right-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <Button size="icon" className="h-8 w-8 rounded-full shadow-lg">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{product.category}</p>
                    <h3 className="font-semibold text-secondary line-clamp-2 h-10 mb-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center text-secondary mb-10">O que dizem nossos clientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.id} className="bg-white border-none shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < t.rating ? "fill-current" : "text-gray-300"} />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {t.name.substring(0, 2)}
                  </div>
                  <span className="text-sm font-semibold">{t.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-primary/5 py-12">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-secondary">Precisa de ajuda?</h2>
            <p className="text-muted-foreground">Entre em contato para orçamentos, agendamentos ou dúvidas sobre peças.</p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-secondary">Atendimento Físico</p>
                  <p className="text-sm text-muted-foreground">R. Jorn. João José Ramalho, 33 - Costa e Silva, João Pessoa - PB</p>
                </div>
              </div>
              {/* More contact info */}
              <div className="w-full h-[300px] rounded-lg overflow-hidden border border-border/50 shadow-sm mt-4">
                  <iframe 
                    src="https://maps.google.com/maps?q=R.+Jorn.+Jo%C3%A3o+Jos%C3%A9+Ramalho,+33+-+Costa+e+Silva,+Jo%C3%A3o+Pessoa+-+PB,+58081-110&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localização Demir Diesel"
                  ></iframe>
              </div>
            </div>
          </div>

          <Card className="bg-white shadow-lg border-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg mb-2">Envie uma mensagem</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Nome</label>
                  <input className="w-full p-2 rounded-md border border-input text-sm" placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Telefone</label>
                  <input className="w-full p-2 rounded-md border border-input text-sm" placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Mensagem</label>
                <textarea className="w-full p-2 rounded-md border border-input text-sm h-24 resize-none" placeholder="Como podemos ajudar?" />
              </div>
              <Button className="w-full font-semibold">Enviar Mensagem</Button>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}
