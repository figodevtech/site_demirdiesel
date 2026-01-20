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
