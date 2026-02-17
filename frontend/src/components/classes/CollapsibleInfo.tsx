import React, { useState } from 'react';

interface CollapsibleInfoProps {
  objective: string;
  material: string;
  intensity: string;
  requirements: string;
  cancellationPolicy: string;
  classSummary?: string | null;
  classPlan?: {
    warmupMin: number;
    mainMin: number;
    finisher: string;
    stretchesMin: number;
  };
}

export const CollapsibleInfo: React.FC<CollapsibleInfoProps> = ({
  objective,
  material,
  intensity,
  requirements,
  cancellationPolicy,
  classSummary,
  classPlan,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-dark-800 bg-dark-900 p-4">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left"
        aria-label="Mostrar más información de la clase"
      >
        <h3 className="text-sm font-semibold text-dark-100">Más información</h3>
        <span className="text-dark-300 text-sm">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm text-dark-300">
          <div>
            <p className="text-dark-100 font-medium">Qué haremos en la clase</p>
            {classPlan ? (
              <ul className="mt-1 space-y-1">
                <li>Calentamiento: {classPlan.warmupMin} min</li>
                <li>Bloque principal: {classPlan.mainMin} min</li>
                <li>Finisher: {classPlan.finisher}</li>
                <li>Estiramientos: {classPlan.stretchesMin} min</li>
              </ul>
            ) : (
              <p>{classSummary || 'Sesión progresiva con técnica, bloque principal y vuelta a la calma.'}</p>
            )}
          </div>
          <div>
            <p className="text-dark-100 font-medium">Objetivo</p>
            <p>{objective}</p>
          </div>
          <div>
            <p className="text-dark-100 font-medium">Material recomendado</p>
            <p>{material}</p>
          </div>
          <div>
            <p className="text-dark-100 font-medium">Intensidad</p>
            <p>{intensity}</p>
          </div>
          <div>
            <p className="text-dark-100 font-medium">Requisitos</p>
            <p>{requirements}</p>
          </div>
          <div>
            <p className="text-dark-100 font-medium">Política de cancelación</p>
            <p>{cancellationPolicy}</p>
          </div>
        </div>
      )}
    </section>
  );
};
