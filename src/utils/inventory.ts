import { supabase } from '@/lib/supabaseClient';

export async function changeProductQuantity(
  productId: number,
  quantity: number,
  type: 'sale' | 'purchase'
) {
  const adjustedDelta = type === 'sale' ? -quantity : quantity;

  const { error } = await supabase.rpc('change_product_quantity', {
    p_product_id: productId,
    p_delta: adjustedDelta,
  });

  if (error) throw error;
}
