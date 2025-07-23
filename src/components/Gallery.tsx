
import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { X } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { useInView } from "@/hooks/useInView";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const Gallery = () => {
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true });
  
  // Get gallery images from localStorage
  const [siteImages] = useLocalStorage<any[]>('site-images', []);
  
  // Filter only gallery images
  const galleryImages = siteImages
    .filter(img => img.section === 'gallery')
    .map(img => ({
      src: img.url,
      alt: img.alt,
      caption: img.alt
    }));
  
  // Use default images if no gallery images are found
  const images = galleryImages.length > 0 ? galleryImages : [
    {
      src: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
      alt: "Deer in forest",
      caption: "Wildlife encounters create unforgettable moments"
    },
    {
      src: "https://images.unsplash.com/photo-1518495973542-4542c06a5843",
      alt: "Sunlight through trees",
      caption: "Discovering the magic of light filtering through the forest"
    },
    {
      src: "https://images.unsplash.com/photo-1469474038136-56623f02e42e",
      alt: "Mountain landscape with sun rays",
      caption: "Morning hikes with breathtaking views"
    },
    {
      src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      alt: "Lake surrounded by trees",
      caption: "Exploring forest waterways and learning about ecosystems"
    },
    {
      src: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f",
      alt: "Deer in forest",
      caption: "Learning to observe wildlife in their natural habitat"
    },
    {
      src: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86",
      alt: "Low angle view of trees",
      caption: "Looking up at the giants of the forest"
    }
  ];
  
  useEffect(() => {
    if (isInView) {
      const galleryItems = sectionRef.current?.querySelectorAll('.gallery-item');
      galleryItems?.forEach((el, index) => {
        setTimeout(() => {
          if (el instanceof HTMLElement) {
            el.classList.add('animate-fade-in');
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }
        }, 150 * (index % 3));
      });
    }
  }, [isInView]);
  
  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => [...prev, index]);
  };
  
  const openLightbox = (index: number) => {
    setActiveImage(index);
    document.body.style.overflow = 'hidden';
  };
  
  const closeLightbox = () => {
    setActiveImage(null);
    document.body.style.overflow = 'auto';
  };
  
  return (
    <section id="gallery" ref={sectionRef} className="py-16 px-4 bg-white">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12 opacity-0 transform translate-y-10 transition-all duration-700"
          style={{ opacity: isInView ? 1 : 0, transform: isInView ? 'translateY(0)' : 'translateY(10px)' }}>
          <span className="inline-block text-sky-700 bg-sky-100 px-3 py-1 rounded-full text-sm font-medium mb-4">
            Camp Moments
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
            Capturing the Magic
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Take a glimpse into the extraordinary experiences that await at Karura Kids Camp, where every moment becomes a cherished memory.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="gallery-item opacity-0 transform translate-y-10 rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-500"
              onClick={() => openLightbox(index)}
              style={{ transitionDelay: `${0.15 * (index % 3)}s` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <div className={cn(
                  "w-full h-full bg-gray-200 animate-pulse-subtle absolute top-0 left-0",
                  loadedImages.includes(index) ? "opacity-0" : "opacity-100"
                )}></div>
                <img 
                  src={image.src}
                  alt={image.alt}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-500 hover:scale-105",
                    loadedImages.includes(index) ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => handleImageLoad(index)}
                  onError={(e) => {
                    // Fallback for broken images
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
                    handleImageLoad(index);
                  }}
                />
              </div>
              <div className="p-4 bg-white">
                <p className="text-gray-700 text-sm">{image.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {activeImage !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white"
            onClick={closeLightbox}
          >
            <X size={24} />
          </button>
          <div className="relative max-w-6xl w-full max-h-[90vh]">
            <img 
              src={images[activeImage].src}
              alt={images[activeImage].alt}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 text-center">
              {images[activeImage].caption}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
