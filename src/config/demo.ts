/**
 * src/config/demo.ts
 * Drapeau global du mode démonstration pour Mwinda Market.
 *
 * Lorsque DEMO_MODE est true :
 * - Un bandeau fin et discret s'affiche en haut du site (fermable par session)
 * - Sur /panier, l'écran de confirmation indique "Commande de démonstration : aucun paiement n'a été effectué"
 * - Sur /devenir-vendeur, l'écran de confirmation indique "Demande de démonstration : aucune donnée n'a été enregistrée"
 *   et la phrase "Vos données sont protégées" est retirée
 * - /connexion conserve son statut "bientôt disponible"
 *
 * Lorsque DEMO_MODE passe à false, tous les bandeaux et mentions de démo disparaissent
 * automatiquement sans autre modification.
 */
export const DEMO_MODE = true;
