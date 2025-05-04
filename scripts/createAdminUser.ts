// scripts/createAdminUser.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "../types/supabase";

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas");
  process.exit(1);
}

// Crear cliente de Supabase con la clave de servicio
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Datos del administrador a crear
const adminEmail = process.argv[2] || "admin@teslalift.com";
const adminPassword = process.argv[3] || "Admin123456";
const adminName = process.argv[4] || "Administrador Principal";

async function createAdminUser() {
  try {
    console.log(`Iniciando creación de usuario administrador: ${adminEmail}`);

    // 1. Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", adminEmail)
      .eq("role", "admin")
      .maybeSingle();

    if (checkError) {
      throw new Error(`Error al verificar usuario existente: ${checkError.message}`);
    }

    if (existingUser) {
      console.log(`El administrador con email ${adminEmail} ya existe. ID: ${existingUser.id}`);
      return;
    }

    // 2. Crear usuario en Auth
    console.log("Creando usuario en Auth...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Confirmar email automáticamente
    });

    if (authError || !authData.user) {
      throw new Error(`Error al crear usuario en Auth: ${authError?.message || "Usuario no creado"}`);
    }

    const userId = authData.user.id;
    console.log(`Usuario creado en Auth con ID: ${userId}`);

    // 3. Crear perfil de usuario como administrador
    console.log("Creando perfil de administrador...");
    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      name: adminName,
      email: adminEmail,
      role: "admin",
      status: "active",
    });

    if (profileError) {
      // Intentar eliminar el usuario de Auth si falla la creación del perfil
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Error al crear perfil de administrador: ${profileError.message}`);
    }

    console.log("¡Usuario administrador creado exitosamente!");
    console.log("----------------------------------------");
    console.log("Credenciales de acceso:");
    console.log(`Email: ${adminEmail}`);
    console.log(`Contraseña: ${adminPassword}`);
    console.log("----------------------------------------");
    console.log("Utiliza estas credenciales para iniciar sesión en la aplicación.");

  } catch (error: any) {
    console.error("Error en el proceso de creación de administrador:", error.message);
    process.exit(1);
  }
}

// Ejecutar la función
createAdminUser();