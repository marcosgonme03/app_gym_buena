import React from 'react';

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
  showIndex?: boolean;
}

export function AdminTable<T>({
  columns, data, loading, emptyMessage = 'Sin datos', keyExtractor, showIndex,
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-400 text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-dark-500">
        <svg className="w-10 h-10 mb-3 text-dark-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-800">
            {showIndex && <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-widest w-10">#</th>}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-widest ${col.width ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-800/60">
          {data.map((row, rowIdx) => (
            <tr key={keyExtractor(row)} className="hover:bg-dark-800/30 transition-colors">
              {showIndex && (
                <td className="px-4 py-3.5 text-sm text-dark-500 w-10">{rowIdx + 1}</td>
              )}
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-sm text-dark-300">
                  {col.render
                    ? col.render(row, rowIdx)
                    : String((row as Record<string, unknown>)[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
