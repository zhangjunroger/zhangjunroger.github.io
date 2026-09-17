import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, RefreshCw, Wifi } from 'lucide-react';

// ============ 二维码展示（含局域网地址选择，供学生手机扫码） ============
export default function QRCodeView(p: {
  path: string;                       // 如 /join?c=ABCD12
  size?: number;
  className?: string;
  caption?: string;
}) {
  const size = p.size ?? 208;
  const [dataUrl, setDataUrl] = useState('');
  const [ips, setIps] = useState<string[]>([]);
  const [ipChoice, setIpChoice] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [manualHost, setManualHost] = useState<string>('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    fetch('/api/server-info')
      .then(r => r.json())
      .then(j => {
        const d = j?.data;
        if (d?.lanIps?.length) {
          setIps(d.lanIps);
          setIpChoice(d.lanIps[0]);
        }
      })
      .catch(() => { /* 离线/无后端时隐藏 */ });
  }, []);

  useEffect(() => {
    const proto = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    // 手动地址 > 局域网IP > 当前地址
    let host: string;
    if (manualHost.trim()) {
      host = manualHost.trim().replace(/^https?:\/\//, '');
    } else if (ipChoice) {
      host = `${ipChoice}${port}`;
    } else {
      host = window.location.host;
    }
    const url = `${proto}//${host}${p.path}`;
    QRCode.toDataURL(url, {
      width: size * 2,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [p.path, size, ipChoice, manualHost]);

  const fullUrl = `${window.location.protocol}//${manualHost.trim() || (ipChoice ? `${ipChoice}${window.location.port ? ':' + window.location.port : ''}` : window.location.host)}${p.path}`;

  return (
    <div className={`flex flex-col items-center gap-3 ${p.className ?? ''}`}>
      <div className="relative rounded-2xl bg-white p-3 shadow-glow-cyan">
        {dataUrl ? (
          <img src={dataUrl} alt="扫码二维码" width={size} height={size} className="block rounded-lg" />
        ) : (
          <div className="flex items-center justify-center text-slate-400" style={{ width: size, height: size }}>
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        )}
        <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Wifi className="w-5 h-5 text-white" />
        </div>
      </div>
      {p.caption && <div className="text-xs text-slate-400">{p.caption}</div>}
      <div className="flex items-center gap-1.5 max-w-full">
        <code className="text-[10px] font-mono text-cyan-300/80 bg-slate-900/70 border border-white/5 rounded-lg px-2 py-1 truncate max-w-[260px]">
          {fullUrl}
        </code>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(fullUrl).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }).catch(() => {});
          }}
          className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 flex items-center justify-center flex-shrink-0 transition"
          title="复制链接"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      {ips.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <span className="text-slate-600">同屏局域网地址:</span>
          {ips.map(ip => (
            <button
              key={ip}
              onClick={() => { setIpChoice(ip); setManualHost(''); }}
              className={`px-2 py-0.5 rounded-md font-mono border transition ${
                ipChoice === ip && !manualHost
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ip}
            </button>
          ))}
          <button
            onClick={() => setShowManual(v => !v)}
            className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200"
          >
            手动
          </button>
        </div>
      )}
      {showManual && (
        <input
          value={manualHost}
          onChange={e => setManualHost(e.target.value)}
          placeholder="例如 192.168.1.100:5173 或 taught.example.com"
          className="input-field !py-1.5 text-xs font-mono max-w-[280px]"
        />
      )}
    </div>
  );
}
