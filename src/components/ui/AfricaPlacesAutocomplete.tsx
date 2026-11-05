"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { AFRICAN_COUNTRIES } from "@/data/countries";

// Liste exhaustive des grandes villes d'Afrique avec métadonnées
const MAJOR_AFRICAN_CITIES: Array<{
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  phoneCode: string;
}> = [
  // ── RD Congo (RDC)
  { city: "Kinshasa", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Lubumbashi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Goma", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Kisangani", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Matadi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Bukavu", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Kolwezi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Mbuji-Mayi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Kananga", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Likasi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Kikwit", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Mbandaka", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Kindu", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Boma", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Uvira", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Tshikapa", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Bunia", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Butembo", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Kalemie", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Isiro", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Mwene-Ditu", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },
  { city: "Beni", country: "RD Congo", countryCode: "CD", flag: "🇨🇩", phoneCode: "+243" },

  // ── Congo Brazzaville
  { city: "Brazzaville", country: "Congo (Brazzaville)", countryCode: "CG", flag: "🇨🇬", phoneCode: "+242" },
  { city: "Pointe-Noire", country: "Congo (Brazzaville)", countryCode: "CG", flag: "🇨🇬", phoneCode: "+242" },
  { city: "Dolisie", country: "Congo (Brazzaville)", countryCode: "CG", flag: "🇨🇬", phoneCode: "+242" },
  { city: "Nkayi", country: "Congo (Brazzaville)", countryCode: "CG", flag: "🇨🇬", phoneCode: "+242" },
  { city: "Ouesso", country: "Congo (Brazzaville)", countryCode: "CG", flag: "🇨🇬", phoneCode: "+242" },

  // ── Côte d'Ivoire
  { city: "Abidjan", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮", phoneCode: "+225" },
  { city: "Yamoussoukro", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮", phoneCode: "+225" },
  { city: "Bouaké", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮", phoneCode: "+225" },
  { city: "San-Pédro", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮", phoneCode: "+225" },
  { city: "Korhogo", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮", phoneCode: "+225" },

  // ── Sénégal
  { city: "Dakar", country: "Sénégal", countryCode: "SN", flag: "🇸🇳", phoneCode: "+221" },
  { city: "Thiès", country: "Sénégal", countryCode: "SN", flag: "🇸🇳", phoneCode: "+221" },
  { city: "Touba", country: "Sénégal", countryCode: "SN", flag: "🇸🇳", phoneCode: "+221" },
  { city: "Saint-Louis", country: "Sénégal", countryCode: "SN", flag: "🇸🇳", phoneCode: "+221" },
  { city: "Ziguinchor", country: "Sénégal", countryCode: "SN", flag: "🇸🇳", phoneCode: "+221" },

  // ── Cameroun
  { city: "Douala", country: "Cameroun", countryCode: "CM", flag: "🇨🇲", phoneCode: "+237" },
  { city: "Yaoundé", country: "Cameroun", countryCode: "CM", flag: "🇨🇲", phoneCode: "+237" },
  { city: "Bafoussam", country: "Cameroun", countryCode: "CM", flag: "🇨🇲", phoneCode: "+237" },
  { city: "Garoua", country: "Cameroun", countryCode: "CM", flag: "🇨🇲", phoneCode: "+237" },
  { city: "Bamenda", country: "Cameroun", countryCode: "CM", flag: "🇨🇲", phoneCode: "+237" },

  // ── Gabon
  { city: "Libreville", country: "Gabon", countryCode: "GA", flag: "🇬🇦", phoneCode: "+241" },
  { city: "Port-Gentil", country: "Gabon", countryCode: "GA", flag: "🇬🇦", phoneCode: "+241" },
  { city: "Franceville", country: "Gabon", countryCode: "GA", flag: "🇬🇦", phoneCode: "+241" },

  // ── Rwanda
  { city: "Kigali", country: "Rwanda", countryCode: "RW", flag: "🇷🇼", phoneCode: "+250" },
  { city: "Gisenyi (Rubavu)", country: "Rwanda", countryCode: "RW", flag: "🇷🇼", phoneCode: "+250" },
  { city: "Butare (Huye)", country: "Rwanda", countryCode: "RW", flag: "🇷🇼", phoneCode: "+250" },

  // ── Burundi
  { city: "Bujumbura", country: "Burundi", countryCode: "BI", flag: "🇧🇮", phoneCode: "+257" },
  { city: "Gitega", country: "Burundi", countryCode: "BI", flag: "🇧🇮", phoneCode: "+257" },

  // ── Angola
  { city: "Luanda", country: "Angola", countryCode: "AO", flag: "🇦🇴", phoneCode: "+244" },
  { city: "Benguela", country: "Angola", countryCode: "AO", flag: "🇦🇴", phoneCode: "+244" },
  { city: "Huambo", country: "Angola", countryCode: "AO", flag: "🇦🇴", phoneCode: "+244" },
  { city: "Cabinda", country: "Angola", countryCode: "AO", flag: "🇦🇴", phoneCode: "+244" },

  // ── Nigeria
  { city: "Lagos", country: "Nigeria", countryCode: "NG", flag: "🇳🇬", phoneCode: "+234" },
  { city: "Abuja", country: "Nigeria", countryCode: "NG", flag: "🇳🇬", phoneCode: "+234" },
  { city: "Kano", country: "Nigeria", countryCode: "NG", flag: "🇳🇬", phoneCode: "+234" },
  { city: "Ibadan", country: "Nigeria", countryCode: "NG", flag: "🇳🇬", phoneCode: "+234" },
  { city: "Port Harcourt", country: "Nigeria", countryCode: "NG", flag: "🇳🇬", phoneCode: "+234" },

  // ── Kenya
  { city: "Nairobi", country: "Kenya", countryCode: "KE", flag: "🇰🇪", phoneCode: "+254" },
  { city: "Mombasa", country: "Kenya", countryCode: "KE", flag: "🇰🇪", phoneCode: "+254" },
  { city: "Kisumu", country: "Kenya", countryCode: "KE", flag: "🇰🇪", phoneCode: "+254" },

  // ── Ouganda
  { city: "Kampala", country: "Ouganda", countryCode: "UG", flag: "🇺🇬", phoneCode: "+256" },
  { city: "Entebbe", country: "Ouganda", countryCode: "UG", flag: "🇺🇬", phoneCode: "+256" },
  { city: "Jinja", country: "Ouganda", countryCode: "UG", flag: "🇺🇬", phoneCode: "+256" },

  // ── Tanzanie
  { city: "Dar es Salaam", country: "Tanzanie", countryCode: "TZ", flag: "🇹🇿", phoneCode: "+255" },
  { city: "Dodoma", country: "Tanzanie", countryCode: "TZ", flag: "🇹🇿", phoneCode: "+255" },
  { city: "Arusha", country: "Tanzanie", countryCode: "TZ", flag: "🇹🇿", phoneCode: "+255" },
  { city: "Zanzibar", country: "Tanzanie", countryCode: "TZ", flag: "🇹🇿", phoneCode: "+255" },

  // ── Mali
  { city: "Bamako", country: "Mali", countryCode: "ML", flag: "🇲🇱", phoneCode: "+223" },
  { city: "Sikasso", country: "Mali", countryCode: "ML", flag: "🇲🇱", phoneCode: "+223" },

  // ── Burkina Faso
  { city: "Ouagadougou", country: "Burkina Faso", countryCode: "BF", flag: "🇧🇫", phoneCode: "+226" },
  { city: "Bobo-Dioulasso", country: "Burkina Faso", countryCode: "BF", flag: "🇧🇫", phoneCode: "+226" },

  // ── Guinée
  { city: "Conakry", country: "Guinée", countryCode: "GN", flag: "🇬🇳", phoneCode: "+224" },
  { city: "Kankan", country: "Guinée", countryCode: "GN", flag: "🇬🇳", phoneCode: "+224" },

  // ── Bénin
  { city: "Cotonou", country: "Bénin", countryCode: "BJ", flag: "🇧🇯", phoneCode: "+229" },
  { city: "Porto-Novo", country: "Bénin", countryCode: "BJ", flag: "🇧🇯", phoneCode: "+229" },
  { city: "Parakou", country: "Bénin", countryCode: "BJ", flag: "🇧🇯", phoneCode: "+229" },

  // ── Togo
  { city: "Lomé", country: "Togo", countryCode: "TG", flag: "🇹🇬", phoneCode: "+228" },
  { city: "Kara", country: "Togo", countryCode: "TG", flag: "🇹🇬", phoneCode: "+228" },

  // ── Tchad
  { city: "N'Djamena", country: "Tchad", countryCode: "TD", flag: "🇹🇩", phoneCode: "+235" },
  { city: "Moundou", country: "Tchad", countryCode: "TD", flag: "🇹🇩", phoneCode: "+235" },

  // ── Centrafrique
  { city: "Bangui", country: "Centrafrique", countryCode: "CF", flag: "🇨🇫", phoneCode: "+236" },

  // ── Niger
  { city: "Niamey", country: "Niger", countryCode: "NE", flag: "🇳🇪", phoneCode: "+227" },
  { city: "Maradi", country: "Niger", countryCode: "NE", flag: "🇳🇪", phoneCode: "+227" },

  // ── Ghana
  { city: "Accra", country: "Ghana", countryCode: "GH", flag: "🇬🇭", phoneCode: "+233" },
  { city: "Kumasi", country: "Ghana", countryCode: "GH", flag: "🇬🇭", phoneCode: "+233" },

  // ── Afrique du Sud
  { city: "Johannesburg", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦", phoneCode: "+27" },
  { city: "Le Cap (Cape Town)", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦", phoneCode: "+27" },
  { city: "Durban", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦", phoneCode: "+27" },
  { city: "Pretoria", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦", phoneCode: "+27" },

  // ── Maroc
  { city: "Casablanca", country: "Maroc", countryCode: "MA", flag: "🇲🇦", phoneCode: "+212" },
  { city: "Rabat", country: "Maroc", countryCode: "MA", flag: "🇲🇦", phoneCode: "+212" },
  { city: "Marrakech", country: "Maroc", countryCode: "MA", flag: "🇲🇦", phoneCode: "+212" },
  { city: "Tanger", country: "Maroc", countryCode: "MA", flag: "🇲🇦", phoneCode: "+212" },

  // ── Algérie
  { city: "Alger", country: "Algérie", countryCode: "DZ", flag: "🇩🇿", phoneCode: "+213" },
  { city: "Oran", country: "Algérie", countryCode: "DZ", flag: "🇩🇿", phoneCode: "+213" },

  // ── Tunisie
  { city: "Tunis", country: "Tunisie", countryCode: "TN", flag: "🇹🇳", phoneCode: "+216" },
  { city: "Sfax", country: "Tunisie", countryCode: "TN", flag: "🇹🇳", phoneCode: "+216" },

  // ── Égypte
  { city: "Le Caire", country: "Égypte", countryCode: "EG", flag: "🇪🇬", phoneCode: "+20" },
  { city: "Alexandrie", country: "Égypte", countryCode: "EG", flag: "🇪🇬", phoneCode: "+20" },

  // ── Zambie
  { city: "Lusaka", country: "Zambie", countryCode: "ZM", flag: "🇿🇲", phoneCode: "+260" },
  { city: "Ndola", country: "Zambie", countryCode: "ZM", flag: "🇿🇲", phoneCode: "+260" },

  // ── Zimbabwe
  { city: "Harare", country: "Zimbabwe", countryCode: "ZW", flag: "🇿🇼", phoneCode: "+263" },
  { city: "Bulawayo", country: "Zimbabwe", countryCode: "ZW", flag: "🇿🇼", phoneCode: "+263" },

  // ── Mozambique
  { city: "Maputo", country: "Mozambique", countryCode: "MZ", flag: "🇲🇿", phoneCode: "+258" },

  // ── Éthiopie
  { city: "Addis-Abeba", country: "Éthiopie", countryCode: "ET", flag: "🇪🇹", phoneCode: "+251" },

  // ── Madagascar
  { city: "Antananarivo", country: "Madagascar", countryCode: "MG", flag: "🇲🇬", phoneCode: "+261" },

  // ── Maurice
  { city: "Port-Louis", country: "Maurice", countryCode: "MU", flag: "🇲🇺", phoneCode: "+230" },
];

export interface PlaceSuggestion {
  label: string; // Ex: "Kinshasa, RD Congo" ou "Sénégal"
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  phoneCode: string;
  type: "city" | "country";
}

interface AfricaPlacesAutocompleteProps {
  value: string;
  onChange: (value: string, details?: PlaceSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function AfricaPlacesAutocomplete({
  value,
  onChange,
  placeholder = "Rechercher une ville ou un pays d'Afrique (ex: Kinshasa, Dakar, Abidjan...)",
  required = false,
  className = "",
}: AfricaPlacesAutocompleteProps) {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [googlePlacesLoaded, setGooglePlacesLoaded] = useState(false);
  const [googlePredictions, setGooglePredictions] = useState<PlaceSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronisation avec la valeur externe
  useEffect(() => {
    if (value !== query) {
      setQuery(value || "");
    }
  }, [value]);

  // Chargement script Google Maps Places si clé disponible
  useEffect(() => {
    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      (typeof window !== "undefined" && (window as any).GOOGLE_MAPS_KEY);

    if (!apiKey) return;
    if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
      setGooglePlacesLoaded(true);
      return;
    }

    const scriptId = "google-maps-places-script";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGooglePlacesLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Requête Google Places Autocomplete Service si actif
  useEffect(() => {
    if (!googlePlacesLoaded || !query || query.trim().length < 2) {
      setGooglePredictions([]);
      return;
    }

    try {
      const google = (window as any).google;
      if (!google?.maps?.places?.AutocompleteService) return;

      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
          types: ["(cities)", "country", "(regions)"],
        },
        (predictions: any[], status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const mapped: PlaceSuggestion[] = predictions.slice(0, 5).map((p) => {
              const terms = p.terms || [];
              const countryTerm = terms[terms.length - 1]?.value || "";
              const cityTerm = terms[0]?.value || "";

              // Trouver le pays correspondant dans nos données africaines
              const matchedCountry = AFRICAN_COUNTRIES.find(
                (c) =>
                  c.name.fr.toLowerCase() === countryTerm.toLowerCase() ||
                  c.name.en.toLowerCase() === countryTerm.toLowerCase() ||
                  p.description.toLowerCase().includes(c.name.fr.toLowerCase())
              );

              return {
                label: p.description,
                city: terms.length > 1 ? cityTerm : "",
                country: matchedCountry?.name.fr || countryTerm,
                countryCode: matchedCountry?.code || "CD",
                flag: matchedCountry?.flag || "🌍",
                phoneCode: matchedCountry?.phoneCode || "+243",
                type: terms.length > 1 ? "city" : "country",
              };
            });
            setGooglePredictions(mapped);
          } else {
            setGooglePredictions([]);
          }
        }
      );
    } catch {
      setGooglePredictions([]);
    }
  }, [query, googlePlacesLoaded]);

  // Suggestions intégrées pour l'ensemble des 54 pays africains + grandes villes
  const localSuggestions = useMemo<PlaceSuggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const results: PlaceSuggestion[] = [];

    // 1. Recherche parmi les 54 Pays d'Afrique
    for (const c of AFRICAN_COUNTRIES) {
      const frName = c.name.fr.toLowerCase();
      const enName = c.name.en.toLowerCase();
      if (frName.includes(q) || enName.includes(q) || c.code.toLowerCase() === q) {
        results.push({
          label: `${c.flag} ${c.name.fr}`,
          city: "",
          country: c.name.fr,
          countryCode: c.code,
          flag: c.flag,
          phoneCode: c.phoneCode,
          type: "country",
        });
      }
    }

    // 2. Recherche parmi les Villes d'Afrique
    for (const item of MAJOR_AFRICAN_CITIES) {
      const cityName = item.city.toLowerCase();
      const countryName = item.country.toLowerCase();
      if (cityName.includes(q) || countryName.includes(q)) {
        results.push({
          label: `${item.city}, ${item.country}`,
          city: item.city,
          country: item.country,
          countryCode: item.countryCode,
          flag: item.flag,
          phoneCode: item.phoneCode,
          type: "city",
        });
      }
    }

    return results.slice(0, 8);
  }, [query]);

  // Fusionner les suggestions : Google Places en priorité si disponible, sinon notre catalogue complet
  const combinedSuggestions = useMemo(() => {
    if (googlePredictions.length > 0) {
      // Dé-doublonner
      const labels = new Set(googlePredictions.map((g) => g.label.toLowerCase()));
      const filteredLocal = localSuggestions.filter((l) => !labels.has(l.label.toLowerCase()));
      return [...googlePredictions, ...filteredLocal].slice(0, 8);
    }
    return localSuggestions;
  }, [googlePredictions, localSuggestions]);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: PlaceSuggestion) => {
    const displayValue = item.type === "city" && item.city ? `${item.city}, ${item.country}` : item.country;
    setQuery(displayValue);
    setIsOpen(false);
    onChange(displayValue, item);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-lg pointer-events-none">
          location_on
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full h-11 pl-10 pr-10 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary ${className}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Menu d'autocomplétion dynamique */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#EA580C]">travel_explore</span>
              Villes & Pays d'Afrique
            </span>
            {googlePlacesLoaded && (
              <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Google Places Actif
              </span>
            )}
          </div>

          {combinedSuggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Aucune ville ou pays africain correspondant à « <strong>{query}</strong> ».
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {combinedSuggestions.map((item, index) => (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-orange-50/70 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg leading-none shrink-0">{item.flag}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-[#EA580C] truncate">
                        {item.type === "city" && item.city ? (
                          <>
                            <span className="font-extrabold">{item.city}</span>
                            <span className="text-slate-400 font-normal">, {item.country}</span>
                          </>
                        ) : (
                          <span>{item.country}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                        <span>Code tél. : {item.phoneCode}</span>
                        <span>&bull;</span>
                        <span>{item.countryCode}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      item.type === "country"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.type === "country" ? "Pays" : "Ville"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
