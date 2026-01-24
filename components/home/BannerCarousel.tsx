"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowLeft } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import banner1 from '@/public/banners/banner_1.png'
import banner2 from '@/public/banners/banner_2.png'
import banner3 from '@/public/banners/banner_3.png'

const bannerData = [
    {
        id: 1,
        title: null,
        description: null,
        image: banner1,
        cta: null,
        link: null,
    },
    {
        id: 2,
        title: null,
        description: null,
        image: banner2,
        cta: null,
        link: null,
    },
    {
        id: 3,
        title: null,
        description: null,
        image: banner3,
        cta: null,
        link: null,
    },

]

export function BannerCarousel() {
    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)
    const [count, setCount] = React.useState(0)
    const [isFlashing, setIsFlashing] = React.useState(false)

    // Helper to handle the flash transition
    const handleTransition = React.useCallback((action: () => void) => {
        if (isFlashing) return
        setIsFlashing(true)
        // Wait for fade to white
        setTimeout(() => {
            action()
            // Wait for slide change then fade out
            setTimeout(() => {
                setIsFlashing(false)
            }, 50)
        }, 300)
    }, [isFlashing])

    // Autoplay logic
    React.useEffect(() => {
        if (!api) return

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })

        const intervalId = setInterval(() => {
            api.scrollNext()
        }, 7000)

        return () => {
            clearInterval(intervalId)
        }
    }, [api])

    return (
        <div className="w-full relative group">
            <Carousel

                setApi={setApi}
                className="w-full"
                opts={{
                    loop: true,
                    duration: 40,

                }}
            >
                <CarouselContent className="ml-0">
                    {bannerData.map((item) => (
                        <CarouselItem key={item.id} className="pl-0">
<div className="relative w-full aspect-16/5 overflow-hidden">
                                {/* Background Image using Next.js Image */}
                                <div className="absolute inset-0">
                                    <Image
  src={item.image}
  alt={item.title || "Banner"}
  fill
  className="object-contain object-center"
  priority={item.id === 1}
/>
                                    {/* <div className="absolute inset-0 bg-gradient-to-r from-[#0A7AAC]/80 to-[#3E418E]/60 mix-blend-multiply" /> */}
                                    {/* <div className="absolute inset-0 bg-black/20" /> */}
                                </div>

                                {/* Content Overlay */}
                                <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-start text-white space-y-6 z-10">
                                    <div className="max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        {item.title && (
                                            <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight drop-shadow-md">
                                                {item.title}
                                            </h2>
                                        )}
                                        {item.description && (
                                            <p className="text-lg md:text-2xl text-white/90 font-medium max-w-xl drop-shadow-sm">
                                                {item.description}
                                            </p>
                                        )}
                                        {item.cta && item.link && (
                                            <div className="pt-4">
                                                <Link href={item.link}>
                                                    <Button
                                                        size="lg"
                                                        className="bg-white text-primary hover:bg-gray-100 border-none font-bold text-base px-8 h-12 rounded-full shadow-lg transition-transform hover:scale-105"
                                                    >
                                                        {item.cta}
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Navigation Buttons (Hidden on mobile, visible on hover desktop) */}
                <div className="hidden md:block">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-white/30 bg-black/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => api?.scrollPrev()}
                    >
                        <ArrowLeft className="h-6 w-6" />
                        <span className="sr-only">Anterior</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-white/30 bg-black/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => api?.scrollNext()}
                    >
                        <ArrowRight className="h-6 w-6" />
                        <span className="sr-only">Próximo</span>
                    </Button>
                </div>

                {/* Dots/Indicators */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-20">
                    {Array.from({ length: count }).map((_, index) => (
                        <button
                            key={index}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300 shadow-sm",
                                current === index + 1
                                    ? "w-8 bg-white"
                                    : "w-2 bg-white/50 hover:bg-white/70"
                            )}
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Ir para slide ${index + 1}`}
                        />
                    ))}
                </div>
            </Carousel>
        </div>
    )
}
