-- Data Wipe Certificates table
-- Stores proof of secure data erasure for each completed sell request
-- Part of the trust & transparency feature set (competitor pain point #7)

CREATE TABLE IF NOT EXISTS public.data_wipe_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
    device_serial TEXT,
    device_type TEXT CHECK (device_type IN ('MacBook', 'iPad')),
    model_name TEXT,
    wipe_method TEXT DEFAULT 'factory_reset' CHECK (wipe_method IN ('factory_reset', 'disk_utility_erase', 'dfu_restore', 'manual')),
    wiped_by_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    wiped_by_name TEXT,
    customer_email TEXT,
    customer_name TEXT,
    certificate_number TEXT UNIQUE,
    notes TEXT,
    wiped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_wipe_certs_request ON public.data_wipe_certificates(sell_request_id);
CREATE INDEX IF NOT EXISTS idx_data_wipe_certs_agent ON public.data_wipe_certificates(wiped_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_data_wipe_certs_number ON public.data_wipe_certificates(certificate_number);

-- RLS policies for data_wipe_certificates
ALTER TABLE public.data_wipe_certificates ENABLE ROW LEVEL SECURITY;

-- Agents can insert certificates for their assigned pickups
CREATE POLICY "Agents can insert wipe certificates" ON public.data_wipe_certificates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.agents 
            WHERE agents.email = auth.email() 
              AND agents.is_active = TRUE 
              AND agents.id = wiped_by_agent_id
        )
    );

-- Agents can view wipe certificates they completed
CREATE POLICY "Agents can view own wipe certificates" ON public.data_wipe_certificates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.agents 
            WHERE agents.email = auth.email() 
              AND agents.is_active = TRUE 
              AND agents.id = wiped_by_agent_id
        )
    );

-- Customers can view certificates for their own sell requests
CREATE POLICY "Users can view own wipe certificates" ON public.data_wipe_certificates
    FOR SELECT USING (
        sell_request_id IN (
            SELECT id FROM public.sell_requests WHERE user_id = auth.uid()
        )
    );

-- Admins can view all certificates
CREATE POLICY "Admins can view all wipe certificates" ON public.data_wipe_certificates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.email = auth.email() 
              AND admin_users.is_active = TRUE
        )
    );


-- Support tickets table (for in-app customer support)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sell_request_id UUID REFERENCES public.sell_requests(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'pricing_dispute', 'pickup_issue', 'payment', 'device_return', 'data_privacy', 'other')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_business ON public.support_tickets(business_id);

-- RLS policies for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Customers can view their own support tickets
CREATE POLICY "Users can view own support tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Customers can create their own support tickets
CREATE POLICY "Users can create support tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Customers can update their own support tickets (e.g. closing them)
CREATE POLICY "Users can update own support tickets" ON public.support_tickets
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins can manage all support tickets
CREATE POLICY "Admins can manage all support tickets" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.email = auth.email() 
              AND admin_users.is_active = TRUE
        )
    );

-- Business admins can view tickets for their business
CREATE POLICY "Business admins can view tickets" ON public.support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.business_admin_access baa
            JOIN public.admin_users au ON au.id = baa.admin_user_id
            WHERE au.email = auth.email() 
              AND au.is_active = TRUE 
              AND baa.is_active = TRUE 
              AND baa.business_id = support_tickets.business_id
        )
    );

-- Business admins can update tickets for their business
CREATE POLICY "Business admins can update tickets" ON public.support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.business_admin_access baa
            JOIN public.admin_users au ON au.id = baa.admin_user_id
            WHERE au.email = auth.email() 
              AND au.is_active = TRUE 
              AND baa.is_active = TRUE 
              AND baa.business_id = support_tickets.business_id
        )
    );

-- Triggers for support_tickets
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Table Grants
GRANT ALL ON public.data_wipe_certificates TO authenticated;
GRANT ALL ON public.data_wipe_certificates TO service_role;

GRANT ALL ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

-- Extend users table for notification preferences and multiple saved addresses
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}'::jsonb,
    ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonb;
