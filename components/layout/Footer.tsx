import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { buscarCategorias } from "@/lib/api";

export default async function Footer() {
    const categorias = (await buscarCategorias()).slice(0, 5);

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
                            {(categorias.length ? categorias : []).map((cat) => (
                                <li key={cat.id}>
                                    <Link href={`/produtos?category=${cat.slug}`} className="hover:text-primary hover:underline">
                                        {cat.nome}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Suporte */}
                    <div>
                        <h4 className="font-semibold mb-4 text-lg">Suporte</h4>
                        <ul className="space-y-2 text-sm opacity-90">
                            <li><Link href="/conta" className="hover:text-primary hover:underline">Minha Conta</Link></li>
                            <li><Link href="/pedidos" className="hover:text-primary hover:underline">Meus Pedidos</Link></li>
                            <li><Link href="/politica-de-privacidade" className="hover:text-primary hover:underline">Política de Privacidade</Link></li>
                            <li><Link href="/trocas-e-devolucoes" className="hover:text-primary hover:underline">Trocas e Devoluções</Link></li>
                            <li><Link href="/duvidas-frequentes" className="hover:text-primary hover:underline">Dúvidas Frequentes</Link></li>
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h4 className="font-semibold mb-4 text-lg">Fale Conosco</h4>
                        <ul className="space-y-3 text-sm opacity-90">
                            <li className="flex items-center gap-2">
                                <Phone size={16} className="text-primary" />
                                <span>(00) 00000-0000</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail size={16} className="text-primary" />
                                <span>contato@demirdiesel.com.br</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin size={16} className="text-primary mt-1" />
                                <span>R. Jorn. João José Ramalho, 33<br />Costa e Silva, João Pessoa - PB</span>
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
