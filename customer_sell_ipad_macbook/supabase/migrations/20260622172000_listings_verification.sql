-- Listings Verification Link
-- Adds sell_request_id to listings table to retrieve verified inspections for buy-side listings

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS sell_request_id UUID REFERENCES public.sell_requests(id) ON DELETE SET NULL;

-- Index for fast lookup of listings from sell requests
CREATE INDEX IF NOT EXISTS idx_listings_sell_request ON public.listings(sell_request_id);
