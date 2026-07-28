import { useState } from 'react';
import ComandasBoard from '../components/comandas/ComandasBoard';
import { useComandasList } from '../hooks/useComandas';

const ESTACIONES = ['Parrilla', 'Fríos', 'Bebidas', 'Postres', 'General'];

export default function ComandasPage() {
  const [filtroEstacion, setFiltroEstacion] = useState('');
  const { comandas, isLoading, error, refetch } = useComandasList(
    filtroEstacion ? { estacion: filtroEstacion } : undefined
  );

  return (
    <ComandasBoard
      comandas={comandas}
      isLoading={isLoading}
      error={error}
      filtroEstacion={filtroEstacion}
      onFiltroChange={setFiltroEstacion}
      estaciones={ESTACIONES}
      onRefetch={refetch}
    />
  );
}
