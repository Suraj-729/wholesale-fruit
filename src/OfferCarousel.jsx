import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export function OfferCarousel({ banners = [], onBannerClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex] || banners[0];
  const gradientClass = currentBanner.bgGradient || "emerald";
  const hasText = Boolean(currentBanner.title || currentBanner.subtitle);

  return (
    <div className="offer-carousel-section">
      <div
        className={`offer-banner-card ${gradientClass}`}
        style={
          currentBanner.imageUrl
            ? {
                backgroundImage: hasText
                  ? `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(${currentBanner.imageUrl})`
                  : `url(${currentBanner.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                cursor: "pointer"
              }
            : {}
        }
        onClick={() => {
          if (onBannerClick) onBannerClick();
          else document.querySelector("#catalog")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        {hasText ? (
          <div className="offer-banner-content">
            {currentBanner.tag && (
              <span className="offer-tag-badge">
                <Sparkles size={13} /> {currentBanner.tag}
              </span>
            )}
            {currentBanner.title && <h1 className="offer-title">{currentBanner.title}</h1>}
            {currentBanner.subtitle && <p className="offer-subtitle">{currentBanner.subtitle}</p>}

            <button className="offer-action-btn">
              {currentBanner.buttonText || "Shop Wholesale Crates"} <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div style={{ position: "absolute", bottom: "20px", right: "24px", zIndex: 2 }}>
            <button className="offer-action-btn">
              {currentBanner.buttonText || "Explore Offers"} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {hasText && <div className="hero-arc-bg" />}
      </div>

      {banners.length > 1 && (
        <div className="carousel-dots-container">
          {banners.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-dot ${idx === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
