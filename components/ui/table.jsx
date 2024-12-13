export function Table({ children, className = '' }) {
  return (
    <table className={`w-full text-sm text-left ${className}`}>
      {children}
    </table>
  )
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`text-xs uppercase ${className}`}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y ${className}`}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className = '' }) {
  return (
    <tr className={`hover ${className}`}>
      {children}
    </tr>
  )
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 ${className}`}>
      {children}
    </td>
  )
}

export function TableHead({ children, className = '', onClick }) {
  return (
    <th 
      className={`px-4 py-3 font-medium ${onClick ? 'cursor-pointer hover' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </th>
  )
} 