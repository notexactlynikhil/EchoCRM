import { supabase } from '../supabase/client'
import { Customer } from '../types'

interface GetCustomersResponse {
  customers: Customer[];
  totalCount: number;
  hasNextPage: boolean;
}

/**
 * Handle database errors safely by translating them into user-friendly messages.
 */
function handleCustomerError(error: any, fallbackMessage: string): Error {
  console.error(error);
  const msg = error?.message || '';
  if (msg.includes('Failed to fetch') || msg.includes('TypeError')) {
    return new Error('Unable to connect to database. Please check your connection.');
  }
  if (msg.includes('violates foreign key constraint') || msg.includes('violates check constraint')) {
    return new Error('Invalid input values provided. Please double check customer details.');
  }
  return new Error(fallbackMessage);
}

/**
 * Fetch a paginated, sorted, and searched list of customers.
 */
export async function getCustomers(
  page: number,
  limit: number = 20,
  search: string = '',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<GetCustomersResponse> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('name', { ascending: sortOrder === 'asc' })
      .range(from, to);

    // Apply OR filter search across name, email, or company
    if (search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},email.ilike.${term},company.ilike.${term}`);
    }

    const { data, count, error } = await query;

    if (error) {
      throw handleCustomerError(error, 'Unable to load customers from database.');
    }

    const customers = data || [];
    const totalCount = count || 0;
    const hasNextPage = from + customers.length < totalCount;

    return {
      customers,
      totalCount,
      hasNextPage,
    };
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while fetching customers.');
  }
}

/**
 * Create a new customer profile.
 * Automatically injects the owner_id from the active authenticated session.
 */
export async function createCustomer(
  cust: Omit<Customer, 'id' | 'created_at' | 'owner_id'>
): Promise<Customer> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('You must be signed in to create a customer.');
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        owner_id: user.id,
        name: cust.name.trim(),
        email: cust.email?.trim() || null,
        phone: cust.phone?.trim() || null,
        company: cust.company?.trim() || null,
        tags: cust.tags || [],
      })
      .select()
      .single();

    if (error) {
      throw handleCustomerError(error, 'Customer could not be created. Please try again.');
    }

    return data;
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while creating customer.');
  }
}

/**
 * Update an existing customer profile.
 */
export async function updateCustomer(
  id: string,
  cust: Partial<Omit<Customer, 'id' | 'created_at' | 'owner_id'>>
): Promise<Customer> {
  try {
    const updateData: any = {};
    if (cust.name !== undefined) updateData.name = cust.name.trim();
    if (cust.email !== undefined) updateData.email = cust.email?.trim() || null;
    if (cust.phone !== undefined) updateData.phone = cust.phone?.trim() || null;
    if (cust.company !== undefined) updateData.company = cust.company?.trim() || null;
    if (cust.tags !== undefined) updateData.tags = cust.tags;

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleCustomerError(error, 'Customer details could not be updated.');
    }

    return data;
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while updating customer.');
  }
}

/**
 * Delete a customer profile.
 */
export async function deleteCustomer(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleCustomerError(error, 'Customer could not be deleted.');
    }
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while deleting customer.');
  }
}
