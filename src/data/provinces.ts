export interface Province {
  id: string;
  name: string;
  capital: string;
  hub: string;
  delay: string;
  isExpress?: boolean;
  zone: "Kinshasa" | "Ouest" | "Grand Katanga" | "Grand Kivu" | "Grand Kasaï" | "Grand Équateur" | "Nord-Est";
}

export const DRC_PROVINCES: Province[] = [
  { id: "kin", name: "Kinshasa", capital: "Kinshasa", hub: "Hub Central Gombe / Limete", delay: "Express 24h", isExpress: true, zone: "Kinshasa" },
  { id: "koc", name: "Kongo-Central", capital: "Matadi", hub: "Hub Portuaire Matadi & Boma", delay: "24h - 48h", isExpress: true, zone: "Ouest" },
  { id: "kwi", name: "Kwilu", capital: "Bandundu", hub: "Hub Kikwit / Bandundu", delay: "2 - 3 jours", zone: "Ouest" },
  { id: "kwa", name: "Kwango", capital: "Kenge", hub: "Relais Kenge", delay: "2 - 3 jours", zone: "Ouest" },
  { id: "mnd", name: "Mai-Ndombe", capital: "Inongo", hub: "Relais Fluvial Inongo / Nioki", delay: "4 - 6 jours", zone: "Ouest" },
  
  { id: "hka", name: "Haut-Katanga", capital: "Lubumbashi", hub: "Hub Régional Lubumbashi", delay: "24h - 48h", isExpress: true, zone: "Grand Katanga" },
  { id: "lua", name: "Lualaba", capital: "Kolwezi", hub: "Hub Minier Kolwezi", delay: "48h", isExpress: true, zone: "Grand Katanga" },
  { id: "hlo", name: "Haut-Lomami", capital: "Kamina", hub: "Relais Kamina", delay: "3 - 5 jours", zone: "Grand Katanga" },
  { id: "tan", name: "Tanganyika", capital: "Kalemie", hub: "Hub Lacustre Kalemie", delay: "3 - 5 jours", zone: "Grand Katanga" },

  { id: "nki", name: "Nord-Kivu", capital: "Goma", hub: "Hub Logistique Goma", delay: "24h - 48h", isExpress: true, zone: "Grand Kivu" },
  { id: "ski", name: "Sud-Kivu", capital: "Bukavu", hub: "Hub Bukavu", delay: "48h", isExpress: true, zone: "Grand Kivu" },
  { id: "man", name: "Maniema", capital: "Kindu", hub: "Relais Kindu", delay: "4 - 6 jours", zone: "Grand Kivu" },

  { id: "kor", name: "Kasaï-Oriental", capital: "Mbuji-Mayi", hub: "Hub Mbuji-Mayi", delay: "48h - 72h", zone: "Grand Kasaï" },
  { id: "kce", name: "Kasaï-Central", capital: "Kananga", hub: "Hub Ferroviaire Kananga", delay: "48h - 72h", zone: "Grand Kasaï" },
  { id: "kas", name: "Kasaï", capital: "Tshikapa", hub: "Relais Tshikapa", delay: "3 - 5 jours", zone: "Grand Kasaï" },
  { id: "lom", name: "Lomami", capital: "Kabinda", hub: "Relais Mwene-Ditu / Kabinda", delay: "3 - 5 jours", zone: "Grand Kasaï" },
  { id: "san", name: "Sankuru", capital: "Lusambo", hub: "Relais Lodja / Lusambo", delay: "5 - 7 jours", zone: "Grand Kasaï" },

  { id: "tsh", name: "Tshopo", capital: "Kisangani", hub: "Hub Fluvial Kisangani", delay: "3 - 4 jours", zone: "Nord-Est" },
  { id: "itu", name: "Ituri", capital: "Bunia", hub: "Hub Bunia", delay: "3 - 5 jours", zone: "Nord-Est" },
  { id: "hue", name: "Haut-Uele", capital: "Isiro", hub: "Relais Isiro", delay: "4 - 6 jours", zone: "Nord-Est" },
  { id: "bue", name: "Bas-Uele", capital: "Buta", hub: "Relais Buta", delay: "4 - 6 jours", zone: "Nord-Est" },

  { id: "equ", name: "Équateur", capital: "Mbandaka", hub: "Hub Mbandaka", delay: "3 - 5 jours", zone: "Grand Équateur" },
  { id: "mon", name: "Mongala", capital: "Lisala", hub: "Relais Lisala / Bumba", delay: "4 - 6 jours", zone: "Grand Équateur" },
  { id: "nub", name: "Nord-Ubangi", capital: "Gbadolite", hub: "Relais Gbadolite", delay: "4 - 6 jours", zone: "Grand Équateur" },
  { id: "sub", name: "Sud-Ubangi", capital: "Gemena", hub: "Hub Gemena", delay: "4 - 6 jours", zone: "Grand Équateur" },
  { id: "tua", name: "Tshuapa", capital: "Boende", hub: "Relais Boende", delay: "5 - 7 jours", zone: "Grand Équateur" },
];
