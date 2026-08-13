import { supabase } from '../supabase/client'
import { Customer, Task, Deal } from '../types'

export interface DashboardStats {
  totalCustomers: number;
  pendingTasksCount: number;
  activeDealsCount: number;
  todayCallsCount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentCustomers: Customer[];
  pendingTasks: Task[];
  activeDeals: Deal[];
}

/**
 * Handle database errors safely by translating them into user-friendly messages.
 */
function handleDbError(error: any, fallbackMessage: string): Error {
  console.error(error);
  const msg = error?.message || '';
  if (msg.includes('Failed to fetch') || msg.includes('TypeError')) {
    return new Error('Unable to connect to database. Please check your connection.');
  }
  if (msg.includes('JWT expired') || msg.includes('Invalid token')) {
    return new Error('Your session has expired. Please sign in again.');
  }
  return new Error(fallbackMessage);
}

/**
 * Fetch all required dashboard data in a single coordinated load.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayISO = startOfToday.toISOString();

    // 1. Fetch Stats Counts
    // Customers count
    const { count: customerCount, error: customerCountErr } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (customerCountErr) throw handleDbError(customerCountErr, 'Unable to retrieve customer statistics.');

    // Pending tasks count
    const { count: pendingTasksCount, error: pendingTasksCountErr } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (pendingTasksCountErr) throw handleDbError(pendingTasksCountErr, 'Unable to retrieve task statistics.');

    // Active deals count (stages not won or lost)
    const { count: activeDealsCount, error: activeDealsCountErr } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .not('stage', 'in', '("won","lost")');
    
    if (activeDealsCountErr) throw handleDbError(activeDealsCountErr, 'Unable to retrieve deal statistics.');

    // Today's calls count
    const { count: todayCallsCount, error: todayCallsCountErr } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', todayISO);
    
    if (todayCallsCountErr) throw handleDbError(todayCallsCountErr, 'Unable to retrieve call statistics.');

    // 2. Fetch Lists
    // Recent customers (limit 5)
    const { data: recentCustomers, error: recentCustErr } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentCustErr) throw handleDbError(recentCustErr, 'Unable to load recent customers.');

    // Pending tasks (limit 5, sorted by due date)
    const { data: pendingTasks, error: pendingTasksErr } = await supabase
      .from('tasks')
      .select('*, customer:customers(name)')
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(5);

    if (pendingTasksErr) throw handleDbError(pendingTasksErr, 'Unable to load pending tasks.');

    // Active deals (stages not won or lost)
    const { data: activeDeals, error: activeDealsErr } = await supabase
      .from('deals')
      .select('*, customer:customers(name)')
      .not('stage', 'in', '("won","lost")')
      .order('created_at', { ascending: false });

    if (activeDealsErr) throw handleDbError(activeDealsErr, 'Unable to load active deals.');

    return {
      stats: {
        totalCustomers: customerCount || 0,
        pendingTasksCount: pendingTasksCount || 0,
        activeDealsCount: activeDealsCount || 0,
        todayCallsCount: todayCallsCount || 0,
      },
      recentCustomers: recentCustomers || [],
      pendingTasks: pendingTasks || [],
      activeDeals: activeDeals || [],
    };
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('An unexpected error occurred while loading dashboard.');
  }
}
