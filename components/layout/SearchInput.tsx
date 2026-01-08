'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

export default function SearchInput({ className }: { className?: string }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/buscar?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className={`relative group ${className}`}>
            <Input
                type="search"
                placeholder="Busque por peças, acessórios ou serviços..."
                className="w-full pl-10 pr-4 bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <button type="submit" className="hidden">Buscar</button>
        </form>
    );
}
