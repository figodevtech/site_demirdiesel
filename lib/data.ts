export type Product = {
    id: string;
    name: string;
    price: number;
    image: string;
    brand: string;
    category: string;
    stock: number;
    rating: number;
    shortDescription: string;
    fullDescription: string;
    compatibility?: string[];
};

export const categories = [
    { id: '1', name: 'Óleos e Fluídos', slug: 'oleos-e-fluidos' },
    { id: '2', name: 'Filtros', slug: 'filtros' },
    { id: '3', name: 'Freios', slug: 'freios' },
    { id: '4', name: 'Suspensão', slug: 'suspensao' },
    { id: '5', name: 'Elétrica', slug: 'eletrica' },
    { id: '6', name: 'Acessórios', slug: 'acessorios' },
    { id: '7', name: 'Ferramentas', slug: 'ferramentas' },
];

export const products: Product[] = [
    {
        id: '1',
        name: 'Óleo Sintético 5W30',
        price: 45.90,
        image: 'https://placehold.co/400x400/0A7AAC/FFFFFF?text=Oleo+5W30',
        brand: 'SuperOil',
        category: 'oleos-e-fluidos',
        stock: 50,
        rating: 4.8,
        shortDescription: 'Óleo sintético de alta performance para motores modernos.',
        fullDescription: 'Proteção avançada contra desgaste e formação de borra. Ideal para veículos flex e gasolina.',
        compatibility: ['Fiat Toro', 'Jeep Renegade', 'VW Golf']
    },
    {
        id: '2',
        name: 'Kit Pastilhas de Freio Dianteiras',
        price: 189.00,
        image: 'https://placehold.co/400x400/3E418E/FFFFFF?text=Pastilhas',
        brand: 'BrakePower',
        category: 'freios',
        stock: 20,
        rating: 4.6,
        shortDescription: 'Pastilhas cerâmicas para maior durabilidade.',
        fullDescription: 'Kit completo para rodas dianteiras. Frenagem silenciosa e eficiente.',
        compatibility: ['Toyota Corolla', 'Honda Civic']
    },
    {
        id: '3',
        name: 'Amortecedor Traseiro',
        price: 350.00,
        image: 'https://placehold.co/400x400/5BA2BC/FFFFFF?text=Amortecedor',
        brand: 'SuspenMax',
        category: 'suspensao',
        stock: 12,
        rating: 4.9,
        shortDescription: 'Conforto e estabilidade garantidos.',
        fullDescription: 'Amortecedor pressurizado a gás. Garantia de 2 anos.',
        compatibility: ['Ford Ranger', 'Chevrolet S10']
    },
    {
        id: '4',
        name: 'Bateria 60Ah',
        price: 450.00,
        image: 'https://placehold.co/400x400/EB9C95/FFFFFF?text=Bateria',
        brand: 'EnergyPro',
        category: 'eletrica',
        stock: 5,
        rating: 4.7,
        shortDescription: 'Alta durabilidade e partida rápida.',
        fullDescription: 'Livre de manutenção. Tecnologia de grade prateada.',
        compatibility: ['Universal']
    },
    {
        id: '5',
        name: 'Filtro de Ar Esportivo',
        price: 120.00,
        image: 'https://placehold.co/400x400/A6D6E1/000000?text=Filtro+Ar',
        brand: 'AirFlow',
        category: 'filtros',
        stock: 30,
        rating: 4.5,
        shortDescription: 'Melhora a admissão de ar e performance.',
        fullDescription: 'Lavável e reutilizável. Aumenta potência do motor.',
        compatibility: ['VW Gol', 'Fiat Palio', 'GM Corsa']
    },
    {
        id: '6',
        name: 'Jogo de Chaves Combinadas',
        price: 89.90,
        image: 'https://placehold.co/400x400/EFF3F8/000000?text=Ferramentas',
        brand: 'ToolMaster',
        category: 'ferramentas',
        stock: 100,
        rating: 4.8,
        shortDescription: 'Aço cromo vanádio.',
        fullDescription: 'Jogo com 12 peças (6mm a 22mm). Resistente à corrosão.',
    }
];

export const services = [
    {
        id: '1',
        title: 'Troca de Óleo',
        description: 'Substituição rápida com óleos premium.',
        icon: 'Droplet'
    },
    {
        id: '2',
        title: 'Revisão Geral',
        description: 'Check-up completo de 50 itens.',
        icon: 'ClipboardList'
    },
    {
        id: '3',
        title: 'Freios',
        description: 'Manutenção e troca de pastilhas/discos.',
        icon: 'Disc'
    },
    {
        id: '4',
        title: 'Suspensão',
        description: 'Diagnóstico e troca de amortecedores.',
        icon: 'Activity'
    },
    {
        id: '5',
        title: 'Diagnóstico Eletrônico',
        description: 'Scanner de última geração.',
        icon: 'Cpu'
    }
];

export const testimonials = [
    {
        id: '1',
        name: 'Carlos Silva',
        rating: 5,
        text: 'Serviço excelente! Meu carro ficou novo.',
        avatar: 'https://placehold.co/100x100/3E418E/FFFFFF?text=CS'
    },
    {
        id: '2',
        name: 'Mariana Costa',
        rating: 5,
        text: 'Entrega rápida das peças e ótimo atendimento.',
        avatar: 'https://placehold.co/100x100/0A7AAC/FFFFFF?text=MC'
    },
    {
        id: '3',
        name: 'Roberto Souza',
        rating: 4,
        text: 'Preço justo e muita transparência no orçamento.',
        avatar: 'https://placehold.co/100x100/EB9C95/FFFFFF?text=RS'
    }
];
