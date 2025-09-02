import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Amuse Kenya - Forest Adventures & Outdoor Education for Children",
  description = "Join Amuse Kenya at Karura Forest for daily activities, camps, birthday parties, school programs and adventures. Building character and confidence through nature exploration for children aged 3-17.",
  keywords = "Amuse Kenya, Karura Forest, forest activities, children camps, birthday parties, school programs, outdoor education, nature exploration, character building, adventure programs",
  canonical = "https://amusekenya.co.ke/",
  ogTitle,
  ogDescription,
  ogImage = "/og-image.png",
  ogType = "website",
  twitterTitle,
  twitterDescription,
  structuredData
}) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title || "Amuse Kenya - Forest Adventures & Outdoor Education for Children"}</title>
      <meta name="description" content={description || "Join Amuse Kenya at Karura Forest for daily activities, camps, birthday parties, school programs and adventures. Building character and confidence through nature exploration for children aged 3-17."} />
      <meta name="keywords" content={keywords || "Amuse Kenya, Karura Forest, forest activities, children camps, birthday parties, school programs, outdoor education, nature exploration, character building, adventure programs"} />
      <meta name="author" content="Amuse Kenya" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonical || "https://amusekenya.co.ke/"} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType || "website"} />
      <meta property="og:url" content={canonical || "https://amusekenya.co.ke/"} />
      <meta property="og:title" content={ogTitle || title || "Amuse Kenya - Forest Adventures & Outdoor Education for Children"} />
      <meta property="og:description" content={ogDescription || description || "Join Amuse Kenya at Karura Forest for daily activities, camps, birthday parties, school programs and adventures. Building character and confidence through nature exploration for children aged 3-17."} />
      <meta property="og:image" content={ogImage || "/og-image.png"} />
      <meta property="og:site_name" content="Amuse Kenya" />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical || "https://amusekenya.co.ke/"} />
      <meta property="twitter:title" content={twitterTitle || ogTitle || title || "Amuse Kenya - Forest Adventures & Outdoor Education for Children"} />
      <meta property="twitter:description" content={twitterDescription || ogDescription || description || "Join Amuse Kenya at Karura Forest for daily activities, camps, birthday parties, school programs and adventures. Building character and confidence through nature exploration for children aged 3-17."} />
      <meta property="twitter:image" content={ogImage || "/og-image.png"} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;