import { supabase } from '../supabase/client'
import { Call, Task, Deal, DealStage } from '../types'

/**
 * Handle database errors safely by translating them into user-friendly messages.
 */
function handleWorkspaceError(error: any, fallbackMessage: string): Error {
  console.error(error);
  const msg = error?.message || '';
  if (msg.includes('Failed to fetch') || msg.includes('TypeError')) {
    return new Error('Unable to connect to database. Please check your connection.');
  }
  return new Error(fallbackMessage);
}

/**
 * Retrieve calls history associated with a specific customer.
 */
export async function getCustomerCalls(customerId: string): Promise<Call[]> {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('customer_id', customerId)
      .order('started_at', { ascending: false });

    if (error) {
      throw handleWorkspaceError(error, 'Unable to load call history.');
    }

    return data || [];
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while loading calls.');
  }
}

/**
 * Retrieve meeting recordings associated with a specific customer.
 */
export async function getCustomerRecordings(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('meeting_recordings')
      .select('*')
      .eq('customer_id', customerId)
      .order('started_at', { ascending: false });

    if (error) {
      throw handleWorkspaceError(error, 'Unable to load recordings.');
    }

    return data || [];
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while loading recordings.');
  }
}

/**
 * Retrieve tasks list associated with a specific customer.
 */
export async function getCustomerTasks(customerId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('customer_id', customerId)
      .order('due_date', { ascending: true });

    if (error) {
      throw handleWorkspaceError(error, 'Unable to load tasks list.');
    }

    return data || [];
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while loading tasks.');
  }
}

/**
 * Retrieve deals associated with a specific customer.
 */
export async function getCustomerDeals(customerId: string): Promise<Deal[]> {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw handleWorkspaceError(error, 'Unable to load customer deals.');
    }

    return data || [];
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while loading deals.');
  }
}

/**
 * Create a new task for a customer.
 */
export async function createTask(
  task: Omit<Task, 'id' | 'created_at' | 'owner_id'>
): Promise<Task> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('You must be signed in to create a task.');
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        owner_id: user.id,
        customer_id: task.customer_id,
        call_id: task.call_id || null,
        description: task.description.trim(),
        due_date: task.due_date || null,
        status: task.status || 'pending',
      })
      .select()
      .single();

    if (error) {
      throw handleWorkspaceError(error, 'Task could not be created. Please verify inputs.');
    }

    return data;
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while creating task.');
  }
}

/**
 * Update an existing task's description, due date, or status.
 */
export async function updateTask(
  id: string,
  task: Partial<Omit<Task, 'id' | 'created_at' | 'owner_id' | 'customer_id'>>
): Promise<Task> {
  try {
    const updateData: any = {};
    if (task.description !== undefined) updateData.description = task.description.trim();
    if (task.due_date !== undefined) updateData.due_date = task.due_date || null;
    if (task.status !== undefined) updateData.status = task.status;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleWorkspaceError(error, 'Task could not be updated.');
    }

    return data;
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while updating task.');
  }
}

/**
 * Delete a task.
 */
export async function deleteTask(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleWorkspaceError(error, 'Task could not be deleted.');
    }
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while deleting task.');
  }
}

/**
 * Update a deal's stage.
 */
export async function updateDealStage(id: string, stage: DealStage): Promise<Deal> {
  try {
    const { data, error } = await supabase
      .from('deals')
      .update({ stage })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleWorkspaceError(error, 'Deal stage could not be updated.');
    }

    return data;
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while updating deal.');
  }
}

/**
 * Fetch all tasks across all customers for the authenticated user.
 */
export async function getGlobalTasks(): Promise<(Task & { customer?: { name: string } })[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('You must be signed in to view tasks.');
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*, customer:customers(name)')
      .eq('owner_id', user.id)
      .order('due_date', { ascending: true });

    if (error) {
      throw handleWorkspaceError(error, 'Unable to load global tasks.');
    }

    return data || [];
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while loading global tasks.');
  }
}

