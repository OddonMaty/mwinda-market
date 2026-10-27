-- Migration 0003 : Fermeture totale de la table orders (deny by default côté client)
-- Suppression de la dernière politique résiduelle issue du schéma initial (orders_vendor_update)
-- Comme order_items et seller_applications, orders n'a désormais AUCUNE politique RLS :
-- tout accès direct depuis le navigateur/client anonyme ou vendeur est strictement refusé.
-- Les commandes transiteront ultérieurement exclusivement par du code serveur sécurisé (Service Role).

DROP POLICY IF EXISTS orders_vendor_update ON public.orders;
