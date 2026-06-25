-- Policy to allow authenticated users to register/insert their own storefronts/businesses as 'draft'
DROP POLICY IF EXISTS "businesses_insert_owner" ON public.businesses;
CREATE POLICY "businesses_insert_owner" ON public.businesses
    FOR INSERT TO authenticated
    WITH CHECK (
        owner_user_id = auth.uid()
        AND status = 'draft'
    );
