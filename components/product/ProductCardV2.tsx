"use cliente";
import { ArrowRight, Heart, Link, ShoppingCart, Star } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Product } from "@/lib/data";

interface ProductCardV2Props {
  product: Product;
}

export default function ProductCardV2({ product }: ProductCardV2Props) {
  return (
    <Card className="h-full relative hover:cursor-pointer hover:shadow-md transition-all duration-100 group border-border/50 bg-white overflow-hidden rounded-sm py-3">
      <div className="aspect-square h-[250px] relative bg-white flex items-center justify-center p-4">
        <div className="w-full h-full bg-white rounded-md relative overflow-hidden flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className=" max-h-full max-w-full group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
      <div className="hidden group-hover:block absolute hover:bg-red-500 hover:text-white top-4 right-4 bg-white p-2 rounded-full shadow-sm">
        <Heart className="h-4 w-4" />
      </div>
      <CardContent className="-mt-5 px-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {product.category}
        </p>
        <h3 className="font-semibold text-secondary line-clamp-2 h-10 mb-2 group-hover:text-primary transition-colors text-sm">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold text-primary">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(product.price)}
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full hover:bg-primary hover:cursor-pointer hover:text-white mt-4 rounded-sm group-hover:bg-primary group-hover:text-white"
        >
          <ShoppingCart /> Ver Produto
        </Button>
      </CardContent>
    </Card>
  );
}
