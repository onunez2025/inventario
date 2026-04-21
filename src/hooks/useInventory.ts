import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ConciliacionRecord, Inventario } from '../types';

export const useInventory = (activeInventory: Inventario | null) => {
  const [data, setData] = useState<ConciliacionRecord[]>([]);
  const [recentCounts, setRecentCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeInventory) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let allRecords: ConciliacionRecord[] = [];
    let from = 0;
    const batchSize = 1000;
    let fetchError = null;

    try {
      while (true) {
        const { data: batch, error } = await supabase
          .from('vista_conciliacion')
          .select('*')
          .eq('inventario_id', activeInventory.id)
          .range(from, from + batchSize - 1);

        if (error) {
          fetchError = error;
          break;
        }

        allRecords = [...allRecords, ...(batch || [])];
        if (!batch || batch.length < batchSize) break;
        from += batchSize;
      }

      if (fetchError) throw fetchError;
      setData(allRecords);

      // Fetch recent counts
      const { data: recent, error: recentError } = await supabase
        .from('conteos')
        .select(`
          id,
          cantidad_fisica,
          created_at,
          observacion,
          articulos(sku, nombre),
          zonas(nombre)
        `)

        .eq('inventario_id', activeInventory.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (recentError) throw recentError;
      setRecentCounts(recent || []);

    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeInventory?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, recentCounts, loading, refresh: fetchData };
};
