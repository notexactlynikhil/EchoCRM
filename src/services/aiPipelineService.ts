import { supabase } from '../supabase/client';
import { AIPipelineResponse } from '../types';

export const processAndSaveCall = async (audioPath: string, customerId: string) => {
  try {
    // 1. Get logged in user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('You must be logged in to process calls.');
    }
    const ownerId = session.user.id;

    // 2. Insert preliminary call record
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .insert({
        customer_id: customerId,
        owner_id: ownerId,
        audio_url: audioPath,
        status: 'processing',
      })
      .select()
      .single();

    if (callError) {
      throw new Error(`Failed to create call record: ${callError.message}`);
    }

    const callId = callData.id;

    // 3. Trigger the local AI pipeline via Electron IPC (window.ai)
    if (!window.ai || !window.ai.processCall) {
      // If we are in the browser, fallback to sample call for testing
      throw new Error('window.ai bridge is unavailable. Please run the app in Electron desktop mode.');
    }

    const res: AIPipelineResponse = await window.ai.processCall(audioPath);

    if (res.status !== 'SUCCESS') {
      // Update the call record to error/done state but with error
      await supabase
        .from('calls')
        .update({ status: 'done', raw_transcript: { error: res.metadata?.errors } })
        .eq('id', callId);
        
      throw new Error(`AI processing failed: ${res.metadata?.errors?.join(', ') || res.status}`);
    }

    // 4. Update the call record with the final results
    const { error: updateCallError } = await supabase
      .from('calls')
      .update({
        raw_transcript: res.transcript,
        duration_seconds: Math.round(res.metadata.audio_duration_seconds),
        status: 'done'
      })
      .eq('id', callId);

    if (updateCallError) {
      throw new Error(`Failed to update call record: ${updateCallError.message}`);
    }

    // 5. Insert Call Summary
    const productDiscussed = res.analysis.products_discussed && res.analysis.products_discussed.length > 0 
      ? res.analysis.products_discussed[0] 
      : null;

    const { error: summaryError } = await supabase
      .from('call_summaries')
      .insert({
        call_id: callId,
        summary_text: res.analysis.summary,
        product: productDiscussed,
        deal_stage: res.analysis.deal_stage,
        sentiment: res.analysis.sentiment
      });

    if (summaryError) {
      console.error('Failed to create call summary:', summaryError);
    }

    // 6. Insert Tasks from Action Items
    if (res.analysis.action_items && res.analysis.action_items.length > 0) {
      const taskInserts = res.analysis.action_items.map(item => ({
        customer_id: customerId,
        call_id: callId,
        owner_id: ownerId,
        description: item.description,
        due_date: item.due_date,
        status: 'pending'
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(taskInserts);

      if (tasksError) {
        console.error('Failed to create tasks from action items:', tasksError);
      }
    }

    // 7. Upsert Deals based on products discussed
    if (productDiscussed && res.analysis.deal_stage) {
      // Check if a deal already exists for this customer and product
      const { data: existingDeals } = await supabase
        .from('deals')
        .select('*')
        .eq('customer_id', customerId)
        .eq('product', productDiscussed);
        
      if (existingDeals && existingDeals.length > 0) {
        // Update the existing deal's stage if it's not won/lost? Or just leave it?
        // Let's just update the stage to the new one
        await supabase
          .from('deals')
          .update({ stage: res.analysis.deal_stage })
          .eq('id', existingDeals[0].id);
      } else {
        // Insert a new deal
        await supabase
          .from('deals')
          .insert({
            customer_id: customerId,
            owner_id: ownerId,
            product: productDiscussed,
            stage: res.analysis.deal_stage
          });
      }
    }

    return res;

  } catch (error: any) {
    console.error('Error processing and saving call:', error);
    throw error;
  }
};
