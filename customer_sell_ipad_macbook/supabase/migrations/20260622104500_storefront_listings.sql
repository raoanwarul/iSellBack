-- =====================================================
-- STOREFRONT LISTINGS - PHASE 1
-- Public-facing business inventory for customer home and shop flows.
-- =====================================================

ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS trust_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS google_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS banner_url TEXT,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_businesses_owner_user_id ON public.businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_is_featured ON public.businesses(is_featured, status);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE public.listing_status AS ENUM ('draft', 'active', 'sold', 'paused', 'rejected');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_condition') THEN
        CREATE TYPE public.listing_condition AS ENUM ('like_new', 'excellent', 'good', 'fair');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'Apple',
    model TEXT NOT NULL,
    variant TEXT,
    storage_gb INTEGER,
    color TEXT,
    year INTEGER,
    condition public.listing_condition NOT NULL DEFAULT 'good',
    price_inr INTEGER NOT NULL CHECK (price_inr >= 0),
    mrp_inr INTEGER,
    description TEXT,
    warranty_months INTEGER NOT NULL DEFAULT 0,
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    status public.listing_status NOT NULL DEFAULT 'draft',
    views_count INTEGER NOT NULL DEFAULT 0,
    leads_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_business_id ON public.listings(business_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_model ON public.listings(model);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price_inr);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;

GRANT SELECT (id, slug, name, city, state, status, is_default, metadata, created_at, updated_at, trust_score, google_rating, short_description, logo_url, banner_url, is_featured)
    ON public.businesses TO anon;
GRANT SELECT ON public.businesses TO authenticated;

DROP POLICY IF EXISTS "businesses_select_public_active" ON public.businesses;
CREATE POLICY "businesses_select_public_active" ON public.businesses
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "listings_select_public_active" ON public.listings;
CREATE POLICY "listings_select_public_active" ON public.listings
    FOR SELECT USING (
        status = 'active'
        AND EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = listings.business_id
              AND b.status = 'active'
        )
    );

DROP POLICY IF EXISTS "listings_insert_owner" ON public.listings;
CREATE POLICY "listings_insert_owner" ON public.listings
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = listings.business_id
              AND b.owner_user_id = auth.uid()
        )
        OR public.is_active_admin()
    );

DROP POLICY IF EXISTS "listings_select_owner_or_admin" ON public.listings;
CREATE POLICY "listings_select_owner_or_admin" ON public.listings
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = listings.business_id
              AND b.owner_user_id = auth.uid()
        )
        OR public.is_active_admin()
    );

DROP POLICY IF EXISTS "listings_update_owner_or_admin" ON public.listings;
CREATE POLICY "listings_update_owner_or_admin" ON public.listings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = listings.business_id
              AND b.owner_user_id = auth.uid()
        )
        OR public.is_active_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = listings.business_id
              AND b.owner_user_id = auth.uid()
        )
        OR public.is_active_admin()
    );

DROP POLICY IF EXISTS "listings_delete_owner_or_admin" ON public.listings;
CREATE POLICY "listings_delete_owner_or_admin" ON public.listings
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = listings.business_id
              AND b.owner_user_id = auth.uid()
        )
        OR public.is_active_admin()
    );

DROP TRIGGER IF EXISTS trigger_update_listings_updated_at ON public.listings;
CREATE TRIGGER trigger_update_listings_updated_at BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();