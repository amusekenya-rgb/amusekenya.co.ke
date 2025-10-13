import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting marketing user creation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if tables exist
    console.log('Checking if database schema is set up...');
    const { data: tables, error: tableCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .limit(1);
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database schema not set up. Please run the SQL migration first.',
          requiresMigration: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create marketing user
    console.log('Creating marketing user...');
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'marketing@amusekenya.co.ke',
      password: 'Marketing2025!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Marketing Team'
      }
    });

    if (userError) {
      if (userError.message.includes('already registered')) {
        console.log('Marketing user already exists');
        
        // Get existing user
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(u => u.email === 'marketing@amusekenya.co.ke');
        
        if (existingUser) {
          // Check if role already assigned
          const { data: existingRole } = await supabaseAdmin
            .from('user_roles')
            .select('*')
            .eq('user_id', existingUser.id)
            .eq('role', 'marketing')
            .single();
          
          if (!existingRole) {
            // Assign marketing role
            await supabaseAdmin
              .from('user_roles')
              .insert({
                user_id: existingUser.id,
                role: 'marketing'
              });
          }
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Marketing user already exists with marketing role assigned',
            credentials: {
              email: 'marketing@amusekenya.co.ke',
              password: 'Marketing2025!',
              loginUrl: '/login'
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        throw userError;
      }
    } else {
      console.log('Marketing user created:', userData.user.id);

      // Assign marketing role
      console.log('Assigning marketing role...');
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: 'marketing'
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }
    }

    console.log('Setup completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Marketing user created successfully',
        credentials: {
          email: 'marketing@amusekenya.co.ke',
          password: 'Marketing2025!',
          loginUrl: '/login'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
