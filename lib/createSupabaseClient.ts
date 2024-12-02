import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Export the Database client to use it in components.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Why was this file created?

// This file was created to initialize the Supabase client and export it for use in the application.
// This avoids having to initialize the client in every component that needs to interact with the database.