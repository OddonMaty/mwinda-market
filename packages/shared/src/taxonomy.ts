/**
 * Arbre des catégories de Mwinda Market (rayons → sous-catégories).
 * Les slugs de rayon sont stockés dans products.department, les sous-catégories dans products.category.
 */
export interface Department { slug: string; name: string; icon: string; categories: string[] }

export const DEPARTMENTS: readonly Department[] = [
  { slug: 'vetements', name: 'Vêtements et Accessoires', icon: 'fa-tshirt', categories: ['Robes', 'Chemises', 'Pantalons', 'Chaussures', 'T-shirts et polos', 'Vestes et manteaux', 'Pagnes et tissus africains', 'Tenues traditionnelles', 'Sous-vêtements', 'Vêtements enfants', 'Casquettes et chapeaux', 'Sacs et maroquinerie', 'Ceintures et écharpes'] },
  { slug: 'electronique', name: 'Électronique grand public', icon: 'fa-mobile-alt', categories: ['Smartphone', 'Tablette', 'Ordinateur', 'Télévision', 'Audio', 'Appareil photo', 'Montre connectée', 'Écouteurs et casques', 'Chargeurs et câbles', 'Batteries externes', 'Accessoires téléphone', 'Drones', 'Consoles et jeux vidéo', 'Caméras de surveillance'] },
  { slug: 'sport', name: 'Sports et Loisirs', icon: 'fa-futbol', categories: ['Football', 'Fitness et musculation', 'Cyclisme', 'Camping et randonnée', 'Pêche', 'Sports de combat', 'Vêtements de sport', 'Jeux et jouets', 'Instruments de musique'] },
  { slug: 'bijoux', name: 'Bijoux, Lunettes et Montres', icon: 'fa-gem', categories: ['Bijoux fantaisie', 'Bijoux en or et argent', 'Montres', 'Lunettes de soleil', 'Lunettes de vue', 'Perles et pierres', 'Colliers et bracelets'] },
  { slug: 'emballage', name: 'Emballage et Impression', icon: 'fa-box', categories: ['Cartons et boîtes', 'Sacs en plastique et papier', 'Étiquettes et autocollants', 'Impression sur textile', 'Cartes de visite et flyers', 'Films et rubans adhésifs', 'Bouteilles et bocaux'] },
  { slug: 'maison', name: 'Maison et Jardin', icon: 'fa-couch', categories: ['Meubles', 'Literie et linge de maison', 'Décoration', 'Cuisine et ustensiles', 'Vaisselle', 'Rangement', 'Jardinage', 'Matelas', 'Tapis et rideaux'] },
  { slug: 'vetements-sport', name: 'Vêtements de sport et plein air', icon: 'fa-running', categories: ['Maillots', 'Survêtements', 'Chaussures de sport', 'Vestes de pluie', 'Équipement de randonnée', 'Tenues de yoga'] },
  { slug: 'beaute', name: 'Beauté et Soins personnels', icon: 'fa-spa', categories: ['Maquillage', 'Soins de la peau', 'Soins des cheveux', 'Perruques et extensions', 'Parfums', 'Savons et huiles naturelles', 'Ongles et manucure', 'Hygiène', 'Matériel de coiffure'] },
  { slug: 'sante', name: 'Santé et Médical', icon: 'fa-heartbeat', categories: ['Matériel médical', 'Tensiomètres et thermomètres', 'Masques et gants', 'Compléments alimentaires', 'Mobilité et orthopédie', 'Premiers secours'] },
  { slug: 'cadeaux', name: 'Cadeaux et Artisanat', icon: 'fa-gift', categories: ['Artisanat africain', 'Sculptures et masques', 'Paniers et vannerie', 'Cadeaux d\'entreprise', 'Fêtes et mariages', 'Souvenirs'] },
  { slug: 'animaux', name: 'Animaux et Accessoires', icon: 'fa-paw', categories: ['Nourriture pour animaux', 'Cages et abris', 'Colliers et laisses', 'Soins vétérinaires', 'Jouets pour animaux'] },
  { slug: 'bureau', name: 'Fournitures scolaires et de bureau', icon: 'fa-pencil-alt', categories: ['Cahiers et papeterie', 'Stylos et crayons', 'Sacs d\'école', 'Uniformes scolaires', 'Mobilier de bureau', 'Matériel de classe', 'Calculatrices'] },
  { slug: 'imprimantes', name: 'Imprimantes et Scanners', icon: 'fa-print', categories: ['Imprimantes', 'Scanners', 'Cartouches et toners', 'Papier d\'impression', 'Photocopieuses'] },
  { slug: 'machines', name: 'Machines industrielles', icon: 'fa-cogs', categories: ['Machines agricoles', 'Machines de transformation alimentaire', 'Machines de construction', 'Machines à coudre', 'Compresseurs et pompes', 'Moulins et broyeurs', 'Équipement de boulangerie'] },
  { slug: 'electromenager', name: 'Électroménager', icon: 'fa-blender', categories: ['Réfrigérateurs et congélateurs', 'Machines à laver', 'Climatiseurs et ventilateurs', 'Cuisinières et fours', 'Mixeurs et blenders', 'Fers à repasser', 'Chauffe-eau', 'Aspirateurs'] },
  { slug: 'auto-outils', name: 'Fournitures et outils automobiles', icon: 'fa-wrench', categories: ['Outils de garage', 'Huiles et lubrifiants', 'Accessoires intérieurs', 'Pneus et jantes', 'Batteries de voiture', 'Produits d\'entretien auto'] },
  { slug: 'pieces-auto', name: 'Pièces et accessoires auto', icon: 'fa-car-side', categories: ['Pièces moteur', 'Freins et suspensions', 'Éclairage auto', 'Pièces de carrosserie', 'Pièces de moto', 'Autoradios et GPS'] },
  { slug: 'outils', name: 'Outils et quincaillerie', icon: 'fa-hammer', categories: ['Outils à main', 'Outils électriques', 'Serrures et cadenas', 'Visserie et fixations', 'Peinture et vernis', 'Échelles et échafaudages', 'Soudure'] },
  { slug: 'energie', name: 'Énergies renouvelables', icon: 'fa-solar-panel', categories: ['Panneaux solaires', 'Onduleurs', 'Batteries solaires', 'Lampadaires solaires', 'Kits solaires domestiques', 'Régulateurs de charge', 'Groupes électrogènes'] },
  { slug: 'securite', name: 'Sécurité et Protection', icon: 'fa-shield-alt', categories: ['Alarmes et détecteurs', 'Vidéosurveillance', 'Extincteurs', 'Équipement de protection individuelle', 'Coffres-forts', 'Chaussures et casques de sécurité'] },
  { slug: 'manutention', name: 'Manutention', icon: 'fa-dolly', categories: ['Chariots et diables', 'Palettes', 'Rayonnages', 'Équipement de levage', 'Chariots élévateurs'] },
  { slug: 'instruments', name: 'Instruments de test et de mesure', icon: 'fa-ruler-combined', categories: ['Multimètres', 'Balances et pèse-personnes', 'Instruments de mesure de distance', 'Thermomètres industriels', 'Équipement de laboratoire'] },
  { slug: 'transmission', name: 'Transmission mécanique', icon: 'fa-gear', categories: ['Roulements', 'Courroies et chaînes', 'Engrenages', 'Moteurs électriques', 'Réducteurs'] },
  { slug: 'composants', name: 'Composants électroniques', icon: 'fa-microchip', categories: ['Circuits intégrés', 'Résistances et condensateurs', 'Cartes Arduino et capteurs', 'Écrans et afficheurs', 'Câbles et connecteurs', 'Piles et batteries'] },
  { slug: 'transport', name: 'Véhicules et Transport', icon: 'fa-truck', categories: ['Motos', 'Tricycles', 'Vélos', 'Voitures d\'occasion', 'Camions et remorques', 'Scooters électriques', 'Bateaux et pirogues'] },
  { slug: 'agriculture', name: 'Agriculture, Alimentation et Boissons', icon: 'fa-seedling', categories: ['Céréales et farines', 'Fruits et légumes', 'Café et thé', 'Huiles et épices', 'Viandes et poissons', 'Boissons', 'Semences et engrais', 'Matériel agricole', 'Produits transformés'] },
  { slug: 'construction', name: 'Construction et Immobilier', icon: 'fa-hard-hat', categories: ['Ciment', 'Fer à béton', 'Carrelage', 'Tôles et toitures', 'Briques et blocs', 'Portes et fenêtres', 'Sanitaires et plomberie', 'Électricité du bâtiment', 'Bois de construction', 'Sable et gravier'] },
  { slug: 'textile', name: 'Textiles et Cuir', icon: 'fa-vest', categories: ['Tissus', 'Cuir et peaux', 'Fil et mercerie', 'Wax et pagnes', 'Dentelle', 'Fermetures et boutons'] },
  { slug: 'chaussures', name: 'Chaussures et Accessoires', icon: 'fa-shoe-prints', categories: ['Chaussures homme', 'Chaussures femme', 'Chaussures enfant', 'Sandales et tongs', 'Bottes', 'Accessoires de chaussures'] },
  { slug: 'bagages', name: 'Bagages, Sacs et Cases', icon: 'fa-suitcase', categories: ['Valises', 'Sacs à dos', 'Sacs à main', 'Sacs de voyage', 'Pochettes et portefeuilles'] },
  { slug: 'mere-enfant', name: 'Mère et Enfant', icon: 'fa-baby', categories: ['Vêtements bébé', 'Poussettes', 'Jouets éducatifs', 'Lait et aliments bébé', 'Couches', 'Chaises et lits bébé'] },
  { slug: 'jeux', name: 'Jeux, Jouets et Passe-temps', icon: 'fa-puzzle-piece', categories: ['Jouets', 'Puzzles et jeux de société', 'Poupées', 'Véhicules télécommandés', 'Collections'] },
  { slug: 'telecom', name: 'Téléphonie et Télécommunications', icon: 'fa-satellite-dish', categories: ['Routeurs et modems', 'Antennes', 'Téléphones basiques', 'Pièces de téléphone', 'Talkies-walkies'] },
  { slug: 'informatique', name: 'Ordinateurs et Réseaux', icon: 'fa-laptop', categories: ['Ordinateurs portables', 'Ordinateurs de bureau', 'Écrans', 'Claviers et souris', 'Disques durs et clés USB', 'Switchs et câbles réseau', 'Logiciels'] },
  { slug: 'eclairage', name: 'Éclairage', icon: 'fa-lightbulb', categories: ['Ampoules LED', 'Lampes de bureau', 'Lampes torches', 'Projecteurs', 'Guirlandes lumineuses', 'Lustres'] },
  { slug: 'evenement', name: 'Événementiel et Fêtes', icon: 'fa-champagne-glasses', categories: ['Décorations de fête', 'Sonorisation', 'Chaises et tables location', 'Bâches et tentes', 'Costumes et déguisements'] },
  { slug: 'education', name: 'Éducation et Formation', icon: 'fa-graduation-cap', categories: ['Livres', 'Matériel pédagogique', 'Cours en ligne', 'Kits de robotique', 'Fournitures d\'artiste'] },
  { slug: 'services', name: 'Services professionnels', icon: 'fa-handshake', categories: ['Impression et design', 'Livraison et logistique', 'Installation et réparation', 'Photographie et vidéo', 'Traduction'] },
  { slug: 'autres', name: 'Autres produits', icon: 'fa-ellipsis-h', categories: ['Divers'] },
];

export const DEPARTMENT_SLUGS = DEPARTMENTS.map((d) => d.slug) as [string, ...string[]];
export const departmentName = (slug: string): string => DEPARTMENTS.find((d) => d.slug === slug)?.name ?? slug;
export const departmentIcon = (slug: string): string => DEPARTMENTS.find((d) => d.slug === slug)?.icon ?? 'fa-tag';
