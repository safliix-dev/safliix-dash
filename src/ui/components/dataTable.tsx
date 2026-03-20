'use client';

import { useState, useMemo, useEffect } from 'react';

export type ColumnConfig<T> =
  | {
      key: keyof T;
      header: string;
      render?: (row: T) => React.ReactNode;
      className?: string;
    }
  | {
      key?: never;
      header: string;
      render: (row: T) => React.ReactNode;
      className?: string;
    };


export type RowAction<T> = {
  label?: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  className?: string;
  show?: (row: T) => boolean;
};


type DataTableProps<T> = {
  data: T[];
  columns: ColumnConfig<T>[];
  actions?: RowAction<T>[];
  itemsPerPage?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends { [key: string]: any }>({
  data,
  columns,
  itemsPerPage = 10,
  actions = [],
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // 🔍 Filtrage des données selon recherche
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    return data.filter((item) =>
      columns.some((col) => {
         if (!col.key) return false; 
        const rawValue = item[col.key];
        if (rawValue === null || rawValue === undefined) return false;
        return rawValue
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      })
    );
  }, [searchTerm, data, columns]);

  // 📄 Pagination sur données filtrées
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // 🔄 Réinitialise la page quand on change de recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="bg-neutral shadow-base-200 shadow-xl overflow-x-auto p-4 space-y-4">
      {/* 🔍 Barre de recherche */}
      <div className="flex justify-between items-center mb-2">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full max-w-sm"
        />
      </div>

      <table className="table table-zebra text-sm">
        <thead className="bg-base-200">
          <tr>
            <th>
              <input type="checkbox" className="checkbox" />
            </th>
            {columns.map((col, index) => (
              <th key={index} className={`text-primary ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
            {actions.length > 0 && (
              <th className="text-primary text-center">ACTIONS</th>
            )}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr key={rowIndex} >
              <td>
                <input type="checkbox" className="checkbox" />
              </td>
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={col.className}>
                 {col.render ? col.render(row) : col.key ? row[col.key] : null}
                </td>
              ))}
              {actions.length > 0 && (
                <td className="flex gap-1 justify-center">
                  {actions
                    .filter((action) => (action.show ? action.show(row) : true))
                    .map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        className={`btn btn-xs ${action.className ?? 'btn-ghost'}`}
                        onClick={() => action.onClick(row)}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                </td>
              )}

            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-2">
        <button
          className="btn btn-sm"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          ←
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="btn btn-sm"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          →
        </button>
      </div>
    </div>
  );
}
