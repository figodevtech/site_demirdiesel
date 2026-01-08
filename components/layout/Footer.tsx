import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-secondary text-secondary-foreground pt-12 pb-6">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    {/* Institucional */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold tracking-tight">Demir Diesel</h3>
                        <p className="text-sm opacity-90 max-w-xs">
                            Especialistas em peças e serviços para veículos diesel e utilitários. Qualidade e confiança há 20 anos.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <Link href="#" className="hover:text-primary transition-colors"><Facebook size={20} /></Link>
                            <Link href="#" className="hover:text-primary transition-colors"><Instagram size={20} /></Link>
                            <Link href="#" className="hover:text-primary transition-colors"><Twitter size={20} /></Link>
                        </div>
                    </div>

                    {/* Categorias */}
                    <div>
                        <h4 className="font-semibold mb-4 text-lg">Categorias</h4>
                        <ul className="space-y-2 text-sm opacity-90">
                            <li><Link href="/categoria/oleos-e-fluidos" className="hover:text-primary hover:underline">Óleos e Fluídos</Link></li>
                            <li><Link href="/categoria/filtros" className="hover:text-primary hover:underline">Filtros</Link></li>
                            <li><Link href="/categoria/freios" className="hover:text-primary hover:underline">Freios</Link></li>
                            <li><Link href="/categoria/suspensao" className="hover:text-primary hover:underline">Suspensão</Link></li>
                            <li><Link href="/categoria/eletrica" className="hover:text-primary hover:underline">Elétrica</Link></li>
                        </ul>
                    </div>

                    {/* Suporte */}
                    <div>
                        <h4 className="font-semibold mb-4 text-lg">Suporte</h4>
                        <ul className="space-y-2 text-sm opacity-90">
                            <li><Link href="/conta" className="hover:text-primary hover:underline">Minha Conta</Link></li>
                            <li><Link href="/pedidos" className="hover:text-primary hover:underline">Meus Pedidos</Link></li>
                            <li><Link href="/politica-privacidade" className="hover:text-primary hover:underline">Política de Privacidade</Link></li>
                            <li><Link href="/trocas" className="hover:text-primary hover:underline">Trocas e Devoluções</Link></li>
                            <li><Link href="/faq" className="hover:text-primary hover:underline">Dúvidas Frequentes</Link></li>
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h4 className="font-semibold mb-4 text-lg">Fale Conosco</h4>
                        <ul className="space-y-3 text-sm opacity-90">
                            <li className="flex items-center gap-2">
                                <Phone size={16} className="text-primary" />
                                <span>(11) 99999-9999</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail size={16} className="text-primary" />
                                <span>contato@demirdiesel.com.br</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin size={16} className="text-primary mt-1" />
                                <span>Av. das Nações, 1000<br />São Paulo - SP</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-10 pt-6 text-center text-sm opacity-60">
                    <p>© {new Date().getFullYear()} Demir Diesel - Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
