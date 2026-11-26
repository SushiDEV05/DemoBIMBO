// Server Actions for Merma registration
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Supabase client with service role (SERVER SIDE only)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Registers a merma entry.
 * @param productId UUID of the product (producto_id)
 * @param peso Numeric weight in kg (or g, as decided by UI)
 * @param motivoId UUID of the merma motive (motivo_id)
 * @param lineaId UUID of the line where the merma occurred
 * @param userId UUID of the user performing the action
 */
export async function registrarMerma(
  productId: string,
  peso: number,
  motivoId: string,
  lineaId: string,
  userId: string
) {
  // Call a PostgreSQL function that handles turn calculation, RLS, and audit.
  const { data, error } = await supabase.rpc("fn_registrar_merma", {
    p_producto_id: productId,
    p_peso: peso,
    p_motivo_id: motivoId,
    p_linea_id: lineaId,
    p_usuario_id: userId,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}
