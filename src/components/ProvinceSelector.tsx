"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DRC_PROVINCES, Province } from "@/data/provinces";
import { useMarket } from "@/context/MarketContext";
import { CountryRegion } from "@/data/countries";

interface ProvinceSelectorProps {
  currentProvinceId?: string;
  onSelect?: (province: Province) => void;
  variant?: "header" | "compact" | "card";
  className?: string;
}

export const ProvinceSelector: React.FC<ProvinceSelectorProps> = ({
  currentProvinceId = "kin",
  onSelect,
  variant = "header",
  className = "",
}) => {
  const { country: currentCountry, isRDC: isRdc } = useMarket();
  const country = currentCountry;

  // Obtenir la liste des régions pour le pays courant
  const availableRegions: Province[] = useMemo(() => {
    if (isRdc || !country.regions || country.regions.length === 0) {
      return DRC_PROVINCES;
    }

    return (country.regions as (Province | CountryRegion)[]).map((r) => {
      const z = "zone" in r && r.zone ? (r.zone as Province["zone"]) : "Ouest";
      return {
        id: r.id || "main",
        name: r.name,
        capital: r.capital || r.name,
        hub: r.hub || `Hub National ${r.name}`,
        delay: r.delay || "24h - 48h",
        isExpress: !!r.isExpress,
        zone: z,
      };
    });
  }, [country.regions, isRdc]);

  const [selectedProvince, setSelectedProvince] = useState<Province>(() => {
    return availableRegions.find((p) => p.id === currentProvinceId) || availableRegions[0];
  });

  // Réinitialiser la province si le pays change et que la province courante n'en fait pas partie
  useEffect(() => {
    const exists = availableRegions.some((p) => p.id === selectedProvince.id);
    if (!exists && availableRegions.length > 0) {
      setSelectedProvince(availableRegions[0]);
    }
  }, [availableRegions, selectedProvince.id]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("Toutes");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (province: Province) => {
    setSelectedProvince(province);
    onSelect?.(province);
    setIsOpen(false);
  };

  const zones = useMemo(() => {
    if (!isRdc) {
      return ["Toutes"];
    }
    return [
      "Toutes",
      "Kinshasa",
      "Grand Katanga",
      "Grand Kivu",
      "Ouest",
      "Grand Kasaï",
      "Nord-Est",
      "Grand Équateur",
    ];
  }, [isRdc]);

  const filteredProvinces = availableRegions.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.capital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hub.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === "Toutes" || p.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  return (
    <>
      {/* Trigger Button */}
      {variant === "header" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant text-left group ${className}`}
          title={`Changer de région de livraison (${currentCountry.name.fr})`}
        >
          <span
            className="material-symbols-outlined text-secondary text-xl shrink-0 group-hover:scale-110 transition-transform"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            location_on
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] text-on-surface-variant font-medium">Livrer à :</span>
            <span className="text-xs font-bold text-on-surface flex items-center gap-1 mt-0.5">
              <span className="truncate max-w-[130px]">{selectedProvince.name}</span>
              <span className="material-symbols-outlined text-xs text-outline shrink-0">
                expand_more
              </span>
            </span>
          </div>
        </button>
      )}

      {variant === "compact" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-container text-xs font-bold hover:bg-secondary-fixed-dim transition ${className}`}
        >
          <span
            className="material-symbols-outlined text-sm text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            location_on
          </span>
          <span>{selectedProvince.name}</span>
          <span className="text-[10px] text-secondary font-medium">({selectedProvince.delay})</span>
        </button>
      )}

      {variant === "card" && (
        <div
          onClick={() => setIsOpen(true)}
          className={`p-3 bg-surface-container-low rounded-lg border border-outline-variant cursor-pointer hover:border-secondary transition ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-secondary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
              <div>
                <p className="text-xs font-semibold text-primary">
                  Destination : {selectedProvince.name}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {selectedProvince.hub} • {selectedProvince.delay}
                </p>
              </div>
            </div>
            <span className="text-xs text-secondary font-bold hover:underline">Modifier</span>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-primary/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-modal border border-outline-variant overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-secondary text-white flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    location_on
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">
                    Choisir votre zone de livraison ({currentCountry.flag} {currentCountry.name.fr})
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {isRdc
                      ? "Réseau logistique national couvrant les 26 provinces de la RDC"
                      : `Hubs logistiques et relais de livraison pour ${currentCountry.name.fr}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center transition"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Search and Zone Filter Bar */}
            <div className="p-4 border-b border-outline-variant space-y-3 bg-white">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une province, ville, chef-lieu ou un hub..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  autoFocus
                />
              </div>

              {/* Zone Pills (si plus d'une zone disponible) */}
              {zones.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {zones.map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setSelectedZone(zone)}
                      className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition ${
                        selectedZone === zone
                          ? "bg-secondary text-white shadow-sm"
                          : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Regions List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-outline-variant/60">
              {filteredProvinces.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">
                    location_off
                  </span>
                  <p className="text-sm font-semibold">
                    Aucune zone ne correspond à votre recherche
                  </p>
                  <p className="text-xs text-outline mt-1">
                    Essayez un autre mot-clé ou réinitialisez le filtre.
                  </p>
                </div>
              ) : (
                filteredProvinces.map((prov) => {
                  const isSelected = selectedProvince.id === prov.id;
                  return (
                    <div
                      key={prov.id}
                      onClick={() => handleSelect(prov)}
                      className={`pt-2.5 pb-2.5 px-3 rounded-lg flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? "bg-secondary-fixed/50 border border-secondary text-secondary"
                          : "hover:bg-surface-container-low text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`material-symbols-outlined text-xl ${
                            isSelected ? "text-secondary" : "text-outline"
                          }`}
                          style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                          {isSelected ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-primary">{prov.name}</span>
                            {prov.capital && (
                              <span className="text-xs text-outline">({prov.capital})</span>
                            )}
                            {prov.isExpress && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary-fixed text-on-secondary-container px-1.5 py-0.5 rounded">
                                Express
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">{prov.hub}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-secondary block">
                          {prov.delay}
                        </span>
                        {prov.zone && (
                          <span className="text-[10px] text-outline">Zone {prov.zone}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                Zone active : <strong className="text-primary">{selectedProvince.name}</strong> (
                {selectedProvince.delay})
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
