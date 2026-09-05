import * as React from 'react';

import { supabase } from '@/lib/supabase';

// "Otros" isn't listed here: it's the implicit label for category = null,
// already offered as its own chip wherever these suggestions are shown.
export const DEFAULT_CATEGORIES = ['Higiene', 'Indumentaria', 'Electrónica', 'Documentos'];

/** Category suggestions for a trip: the defaults plus whatever's already been typed on any item in it. */
export function useCategorySuggestions(tripId: string) {
  const [suggestions, setSuggestions] = React.useState<string[]>(DEFAULT_CATEGORIES);

  const refresh = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('category, packing_lists!inner(trip_id)')
      .eq('packing_lists.trip_id', tripId)
      .not('category', 'is', null);

    if (!error && data) {
      const used = data.map((row) => row.category).filter((c): c is string => !!c);
      setSuggestions(Array.from(new Set([...DEFAULT_CATEGORIES, ...used])));
    }
  }, [tripId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return { suggestions, refresh };
}
