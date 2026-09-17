import { memo, type ReactNode } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
  className?: string;
}

/**
 * 支持 Markdown + LaTeX 混合渲染的文本组件
 * - 行内公式: $...$
 * - 块级公式: $$...$$
 * - 加粗: **text**
 * - 斜体: *text*
 * - 无序列表: - item 或 • item
 * - 有序列表: 1. item
 * - 表格: | a | b |
 */

// 渲染行内 markdown（加粗、斜体、行内公式）
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // 匹配 $$...$$, $...$, **...**, *...*
  const pattern = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  while ((match = pattern.exec(text)) !== null) {
    // 前面的普通文本
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }
    const tok = match[0];

    if (tok.startsWith('$$') && tok.endsWith('$$')) {
      const formula = tok.slice(2, -2).trim();
      try {
        nodes.push(<div key={`${keyBase}-bm${k}`} className="my-2 overflow-x-auto"><BlockMath math={formula} /></div>);
      } catch { nodes.push(<code key={`${keyBase}-bm${k}`}>{formula}</code>); }
    } else if (tok.startsWith('$') && tok.endsWith('$')) {
      const formula = tok.slice(1, -1).trim();
      try { nodes.push(<InlineMath key={`${keyBase}-im${k}`} math={formula} />); }
      catch { nodes.push(<code key={`${keyBase}-im${k}`}>{formula}</code>); }
    } else if (tok.startsWith('**') && tok.endsWith('**')) {
      nodes.push(<strong key={`${keyBase}-b${k}`} className="font-bold text-white">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('*') && tok.endsWith('*')) {
      nodes.push(<em key={`${keyBase}-i${k}`} className="italic text-signal-200">{tok.slice(1, -1)}</em>);
    }

    lastIdx = match.index + tok.length;
    k++;
  }
  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }
  return nodes;
}

// 渲染表格行
function parseTableRow(line: string): string[] {
  return line.split('|').map(c => c.trim()).filter((_, i, arr) => {
    // 去除首尾空单元格
    if (i === 0 && arr[0] === '') return false;
    if (i === arr.length - 1 && arr[arr.length - 1] === '') return false;
    return true;
  });
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function LatexContent({ content, className = '' }: Props) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listKey = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = [...listItems];
    const lt = listType;
    elements.push(
      lt === 'ol' ? (
        <ol key={`ol-${listKey}`} className="list-decimal list-inside space-y-1.5 ml-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-slate-200 leading-relaxed">{renderInline(item, `ol-${listKey}-${idx}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={`ul-${listKey}`} className="space-y-1.5 ml-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-200 leading-relaxed">
              <span className="text-signal-400 mt-0.5 flex-shrink-0">•</span>
              <span className="flex-1">{renderInline(item, `ul-${listKey}-${idx}`)}</span>
            </li>
          ))}
        </ul>
      )
    );
    listItems = [];
    listType = null;
    listKey++;
  };

  while (i < lines.length) {
    const line = lines[i];

    // 块级公式 $$...$$
    if (line.trim().startsWith('$$')) {
      flushList();
      let formula = line.trim().slice(2);
      if (formula.endsWith('$$')) {
        formula = formula.slice(0, -2).trim();
        try {
          elements.push(<div key={`blk-${i}`} className="my-3 overflow-x-auto py-1 text-center"><BlockMath math={formula} /></div>);
        } catch { elements.push(<pre key={`blk-${i}`} className="p-3 bg-slate-900/50 rounded text-amber-300">{formula}</pre>); }
        i++;
        continue;
      }
      // 多行公式
      let fullFormula = formula;
      i++;
      while (i < lines.length && !lines[i].includes('$$')) {
        fullFormula += '\n' + lines[i];
        i++;
      }
      if (i < lines.length) {
        fullFormula += '\n' + lines[i].replace(/\$\$$/, '');
        i++;
      }
      fullFormula = fullFormula.replace(/\$\$$/, '').trim();
      try {
        elements.push(<div key={`blk-${i}`} className="my-3 overflow-x-auto py-1 text-center"><BlockMath math={fullFormula} /></div>);
      } catch { elements.push(<pre key={`blk-${i}`} className="p-3 bg-slate-900/50 rounded text-amber-300">{fullFormula}</pre>); }
      continue;
    }

    // 空行
    if (line.trim() === '') {
      flushList();
      elements.push(<div key={`sp-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // 表格
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushList();
      const headers = parseTableRow(line);
      i += 2; // 跳过分隔行
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      elements.push(
        <div key={`tbl-${i}`} className="my-3 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/15">
                {headers.map((h, idx) => (
                  <th key={idx} className="text-left px-3 py-2 text-signal-300 font-semibold whitespace-nowrap">
                    {renderInline(h, `th-${idx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-white/5 hover:bg-white/[0.02]">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-slate-200 whitespace-nowrap">
                      {renderInline(cell, `td-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 有序列表 1. 2. 3.
    if (/^\d+\.\s/.test(line.trim())) {
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listItems.push(line.trim().replace(/^\d+\.\s/, ''));
      i++;
      continue;
    }

    // 无序列表 - 或 •
    if (/^[-•]\s/.test(line.trim())) {
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listItems.push(line.trim().replace(/^[-•]\s/, ''));
      i++;
      continue;
    }

    // 普通段落
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-slate-200 leading-relaxed">
        {renderInline(line, `p-${i}`)}
      </p>
    );
    i++;
  }
  flushList();

  return <div className={className}>{elements}</div>;
}

export default memo(LatexContent);
