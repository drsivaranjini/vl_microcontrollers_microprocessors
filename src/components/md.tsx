import { Fragment } from 'react';

/**
 * Minimal inline "markdown" renderer — handles `code` and **bold** spans only. Used so experiment
 * content can be written as plain strings (matching how the source manual/registers tables read)
 * without needing a full markdown/MDX pipeline for a handful of short strings.
 */
export function renderInline(text: string): React.ReactNode {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return tokens.map((tok, i) => {
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return <code key={i}>{tok.slice(1, -1)}</code>;
    }
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return <strong key={i}>{tok.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{tok}</Fragment>;
  });
}

export function P({ children }: { children: string }) {
  return <p>{renderInline(children)}</p>;
}

export interface RegisterRow {
  m: string; // mnemonic (rendered as code automatically)
  d: string; // description (supports `code` / **bold** spans)
}

export function RegistersTable({ rows }: { rows: RegisterRow[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Mnemonic</th>
          <th>Meaning</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>
              <code>{r.m}</code>
            </td>
            <td>{renderInline(r.d)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export interface OutputRow {
  cells: string[];
}

export function OutputTable({ headers, rows }: { headers: string[]; rows: OutputRow[] }) {
  return (
    <table>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.cells.map((c, j) => (
              <td key={j}>{renderInline(c)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
