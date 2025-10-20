// Supabase Edge Function to clean up old events
// This should be triggered daily via Supabase cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting cleanup of old events...');

    // Find events that ended more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: oldEvents, error: fetchError } = await supabase
      .from('events')
      .select('id, title, event_photos(storage_path)')
      .or(`ends_at.lt.${thirtyDaysAgo.toISOString()},and(starts_at.lt.${thirtyDaysAgo.toISOString()},ends_at.is.null)`);

    if (fetchError) {
      console.error('Error fetching old events:', fetchError);
      throw fetchError;
    }

    if (!oldEvents || oldEvents.length === 0) {
      console.log('No old events to clean up');
      return new Response(
        JSON.stringify({ message: 'No events to clean up', count: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${oldEvents.length} events to clean up`);

    // Delete photos from storage
    let deletedPhotos = 0;
    for (const event of oldEvents) {
      if (event.event_photos && event.event_photos.length > 0) {
        for (const photo of event.event_photos) {
          // Extract filename from storage_path (e.g., "event-images/filename.jpg")
          const filePath = photo.storage_path.replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/public\/[^\/]+\//, '');
          
          const { error: deleteError } = await supabase.storage
            .from('event-images')
            .remove([filePath]);

          if (deleteError) {
            console.error(`Failed to delete photo ${filePath}:`, deleteError);
          } else {
            deletedPhotos++;
            console.log(`Deleted photo: ${filePath}`);
          }
        }
      }
    }

    // Delete the events (cascade will handle related records)
    const eventIds = oldEvents.map(e => e.id);
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .in('id', eventIds);

    if (deleteError) {
      console.error('Error deleting events:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted ${eventIds.length} events and ${deletedPhotos} photos`);

    return new Response(
      JSON.stringify({
        message: 'Cleanup completed successfully',
        eventsDeleted: eventIds.length,
        photosDeleted: deletedPhotos,
        eventIds: eventIds,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
