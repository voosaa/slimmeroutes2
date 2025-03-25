-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drivers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create addresses table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  notes TEXT,
  time_spent INTEGER,
  appointment_time TIMESTAMP WITH TIME ZONE,
  appointment_window INTEGER DEFAULT 60,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create routes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  addresses JSONB NOT NULL,
  optimized_order JSONB NOT NULL,
  total_distance NUMERIC NOT NULL,
  total_duration NUMERIC NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver_routes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.driver_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  addresses JSONB NOT NULL,
  optimized_order JSONB NOT NULL,
  total_distance NUMERIC NOT NULL,
  total_duration NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  hourly_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stored procedure for adding addresses to bypass schema cache issues
CREATE OR REPLACE FUNCTION public.add_address(
  p_address TEXT,
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_notes TEXT DEFAULT NULL,
  p_time_spent INTEGER DEFAULT NULL,
  p_appointment_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_appointment_window INTEGER DEFAULT 60
) RETURNS SETOF public.addresses AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.addresses (
    user_id,
    address,
    lat,
    lng,
    notes,
    time_spent,
    appointment_time,
    appointment_window
  ) VALUES (
    auth.uid(),
    p_address,
    p_lat,
    p_lng,
    p_notes,
    p_time_spent,
    p_appointment_time,
    p_appointment_window
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a raw SQL function to insert addresses directly
CREATE OR REPLACE FUNCTION public.insert_address_raw(
  user_id_param UUID,
  address_param TEXT,
  lat_param NUMERIC,
  lng_param NUMERIC,
  notes_param TEXT DEFAULT NULL,
  time_spent_param INTEGER DEFAULT NULL,
  appointment_time_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  appointment_window_param INTEGER DEFAULT 60
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Use dynamic SQL to bypass schema cache issues
  EXECUTE format('
    INSERT INTO public.addresses (
      user_id, 
      address, 
      lat, 
      lng, 
      notes, 
      time_spent, 
      appointment_time, 
      appointment_window
    ) VALUES (
      %L, %L, %L, %L, %L, %L, %L, %L
    ) RETURNING to_jsonb(addresses.*)
  ', 
    user_id_param, 
    address_param, 
    lat_param, 
    lng_param, 
    notes_param, 
    time_spent_param, 
    appointment_time_param, 
    appointment_window_param
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.add_address TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_address_raw TO authenticated;

-- Create RLS policies for tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for drivers
CREATE POLICY "Users can view their own drivers" ON public.drivers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own drivers" ON public.drivers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own drivers" ON public.drivers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own drivers" ON public.drivers
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for addresses
CREATE POLICY "Users can view their own addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for routes
CREATE POLICY "Users can view their own routes" ON public.routes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own routes" ON public.routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routes" ON public.routes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routes" ON public.routes
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for driver_routes
CREATE POLICY "Users can view their own driver routes" ON public.driver_routes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.routes WHERE id = route_id
    )
  );
CREATE POLICY "Users can insert their own driver routes" ON public.driver_routes
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.routes WHERE id = route_id
    )
  );
CREATE POLICY "Users can update their own driver routes" ON public.driver_routes
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.routes WHERE id = route_id
    )
  );
CREATE POLICY "Users can delete their own driver routes" ON public.driver_routes
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.routes WHERE id = route_id
    )
  );

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);
