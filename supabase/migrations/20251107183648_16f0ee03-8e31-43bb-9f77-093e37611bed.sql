-- Create enum types
CREATE TYPE public.app_role AS ENUM ('citizen', 'officer', 'admin', 'government');
CREATE TYPE public.complaint_status AS ENUM ('filed', 'verified', 'processing', 'resolved');
CREATE TYPE public.complaint_category AS ENUM (
  'Water Supply',
  'Road & Transport',
  'Electricity',
  'Waste Management',
  'Public Safety',
  'Healthcare',
  'Education',
  'Other'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
  ('Water Supply', 'Water pipeline, leakage, and supply issues'),
  ('Road & Transport', 'Road repairs, potholes, and transportation'),
  ('Electricity', 'Power outages, street lights, and electrical issues'),
  ('Waste Management', 'Garbage collection and waste disposal'),
  ('Public Safety', 'Safety concerns and emergency services'),
  ('Healthcare', 'Public health and medical facilities'),
  ('Education', 'Educational institutions and facilities'),
  ('Other', 'General complaints and miscellaneous issues');

-- Create complaints table
CREATE TABLE public.complaints (
  id TEXT PRIMARY KEY DEFAULT ('LOK' || to_char(now(), 'YYMMDD') || LPAD(floor(random() * 10000)::TEXT, 4, '0')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.complaint_category NOT NULL,
  location_address TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  department_id UUID REFERENCES public.departments(id),
  status public.complaint_status NOT NULL DEFAULT 'filed',
  upvotes INTEGER NOT NULL DEFAULT 0,
  image_urls TEXT[],
  video_url TEXT,
  voice_note_url TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  resolution_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create complaint_upvotes table to track who upvoted
CREATE TABLE public.complaint_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(complaint_id, user_id)
);

-- Create complaint_updates table for tracking progress
CREATE TABLE public.complaint_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  remarks TEXT NOT NULL,
  proof_url TEXT,
  status public.complaint_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
$$;

-- Create function to auto-assign department based on category
CREATE OR REPLACE FUNCTION public.auto_assign_department()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT id INTO NEW.department_id
  FROM public.departments
  WHERE name = NEW.category::TEXT;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-department assignment
CREATE TRIGGER assign_department_on_insert
BEFORE INSERT ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_department();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  -- Auto-assign citizen role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for departments
CREATE POLICY "Anyone can view departments"
ON public.departments FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for complaints
CREATE POLICY "Anyone can view all complaints"
ON public.complaints FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Citizens can create complaints"
ON public.complaints FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'citizen') AND auth.uid() = user_id);

CREATE POLICY "Users can update own complaints"
ON public.complaints FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Officers and admins can update complaints in their department"
ON public.complaints FOR UPDATE
TO authenticated
USING (
  (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'))
  AND department_id IN (
    SELECT d.id FROM public.departments d
    JOIN public.profiles p ON p.department = d.name
    WHERE p.id = auth.uid()
  )
);

-- RLS Policies for complaint_upvotes
CREATE POLICY "Anyone can view upvotes"
ON public.complaint_upvotes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own upvotes"
ON public.complaint_upvotes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for complaint_updates
CREATE POLICY "Anyone can view complaint updates"
ON public.complaint_updates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Officers and admins can create updates"
ON public.complaint_updates FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'))
  AND auth.uid() = admin_id
);

-- Create indexes for better performance
CREATE INDEX idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX idx_complaints_department_id ON public.complaints(department_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX idx_complaint_upvotes_complaint_id ON public.complaint_upvotes(complaint_id);
CREATE INDEX idx_complaint_updates_complaint_id ON public.complaint_updates(complaint_id);

-- Enable realtime for complaints
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_updates;