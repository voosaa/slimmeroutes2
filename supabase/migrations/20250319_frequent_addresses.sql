-- Create frequent_addresses table
CREATE TABLE IF NOT EXISTS frequent_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  notes TEXT,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add a unique constraint to prevent duplicate addresses per user
  UNIQUE(user_id, address)
);

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_address_usage(address_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE frequent_addresses
  SET usage_count = usage_count + 1
  WHERE id = address_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for frequent_addresses table
ALTER TABLE frequent_addresses ENABLE ROW LEVEL SECURITY;

-- Policy for selecting addresses (users can only see their own)
CREATE POLICY select_own_addresses ON frequent_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for inserting addresses (users can only insert their own)
CREATE POLICY insert_own_addresses ON frequent_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating addresses (users can only update their own)
CREATE POLICY update_own_addresses ON frequent_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for deleting addresses (users can only delete their own)
CREATE POLICY delete_own_addresses ON frequent_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY select_own_profile ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY update_own_profile ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY insert_own_profile ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for creating profile after user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
