-- Migration 0002 : Durcissement de la sécurité RLS et protection des champs plateforme
-- 1. Suppression des politiques trop permissives sur orders et order_items
DROP POLICY IF EXISTS orders_insert_anon ON public.orders;
DROP POLICY IF EXISTS orders_select_public ON public.orders;
DROP POLICY IF EXISTS order_items_insert_anon ON public.order_items;
DROP POLICY IF EXISTS order_items_select_public ON public.order_items;

-- 2. Suppression des politiques sur seller_applications
DROP POLICY IF EXISTS seller_apps_insert ON public.seller_applications;
DROP POLICY IF EXISTS seller_apps_select_own ON public.seller_applications;

-- 3. Durcissement de la table vendors : un vendeur ne lit QUE sa propre ligne
DROP POLICY IF EXISTS vendors_select_own ON public.vendors;
CREATE POLICY vendors_select_own ON public.vendors
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Garantie de sécurité pour la fonction is_vendor_of_shop (SECURITY DEFINER + search_path public)
CREATE OR REPLACE FUNCTION public.is_vendor_of_shop(p_shop_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.shop_id = p_shop_id AND v.user_id = auth.uid()
  );
$$;

-- Fix search_path pour generate_order_reference
ALTER FUNCTION public.generate_order_reference() SET search_path = public;

-- 4. Protection des champs réservés à la plateforme (shops & products)
-- Déclencheur shops : empêche les vendeurs de modifier verified, top_seller, featured, rating, review_count, is_active, is_demo
CREATE OR REPLACE FUNCTION public.protect_shop_platform_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.verified := OLD.verified;
    NEW.top_seller := OLD.top_seller;
    NEW.featured := OLD.featured;
    NEW.rating := OLD.rating;
    NEW.review_count := OLD.review_count;
    NEW.is_active := OLD.is_active;
    NEW.is_demo := OLD.is_demo;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_shop_platform_fields ON public.shops;
CREATE TRIGGER trg_protect_shop_platform_fields
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_shop_platform_fields();

REVOKE EXECUTE ON FUNCTION public.protect_shop_platform_fields() FROM public, anon, authenticated;

-- Déclencheur products : empêche les vendeurs de falsifier rating, review_count, is_active, is_demo à l'insertion et à la mise à jour
CREATE OR REPLACE FUNCTION public.protect_product_platform_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.rating := 0;
      NEW.review_count := 0;
      NEW.is_active := true;
      NEW.is_demo := false;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.rating := OLD.rating;
      NEW.review_count := OLD.review_count;
      NEW.is_active := OLD.is_active;
      NEW.is_demo := OLD.is_demo;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_product_platform_fields ON public.products;
CREATE TRIGGER trg_protect_product_platform_fields
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_product_platform_fields();

REVOKE EXECUTE ON FUNCTION public.protect_product_platform_fields() FROM public, anon, authenticated;
