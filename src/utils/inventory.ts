import { supabase } from '@/lib/supabaseClient';

export async function changeProductQuantity(
  productId: number,
  delta: number
) {
  const { error } = await supabase.rpc('change_product_quantity', {
    p_product_id: productId,
    p_delta:      delta,
  });
  if (error) throw error;
}

