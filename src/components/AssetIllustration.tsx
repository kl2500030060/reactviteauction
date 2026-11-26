import React from 'react';
import type { AssetSubtype } from '../types/auction';
import { SUBTYPE_LABELS } from '../data/catalog';

interface AssetIllustrationProps {
  assetType: AssetSubtype;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const ACCENT_BG: Partial<Record<AssetSubtype, string>> = {
  gold: 'bg-amber-50/70 dark:bg-amber-950/20',
  coin_vault: 'bg-amber-50/70 dark:bg-amber-950/20',
  chronograph: 'bg-amber-50/50 dark:bg-amber-950/15',
};

function renderVectorGraphic(assetType: AssetSubtype) {
  const stroke = 'currentColor';
  const accent = '#6366F1';
  const goldStroke = '#D97706';

  switch (assetType) {
    case 'sedan':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="104" x2="220" y2="104" strokeOpacity="0.22" strokeDasharray="3 4" />
          <path d="M32 88 L36 74 Q40 66 56 64 L82 46 Q94 40 120 40 L148 40 Q164 40 178 58 L202 64 Q212 67 212 78 L210 88" />
          <path d="M56 88 L184 88" />
          <path d="M74 63 L92 48 L145 48 L164 63 Z" stroke={accent} strokeWidth="1.6" fill={accent} fillOpacity="0.08" />
          <line x1="120" y1="48" x2="120" y2="63" stroke={accent} strokeWidth="1.4" />
          <path d="M40 74 L206 74" strokeOpacity="0.35" strokeWidth="1.3" />
          <circle cx="68" cy="88" r="15" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="68" cy="88" r="7" strokeOpacity="0.55" />
          <circle cx="176" cy="88" r="15" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="176" cy="88" r="7" strokeOpacity="0.55" />
        </g>
      );

    case 'suv':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="104" x2="220" y2="104" strokeOpacity="0.22" strokeDasharray="3 4" />
          <path d="M36 86 L36 62 L44 38 L150 38 L166 58 L204 62 Q212 64 212 74 L212 86" />
          <path d="M56 86 L186 86" />
          <line x1="50" y1="32" x2="144" y2="32" stroke={accent} strokeWidth="1.6" />
          <rect x="26" y="54" width="9" height="24" rx="3" strokeOpacity="0.7" />
          <path d="M52 45 L144 45 L156 59 L46 59 Z" stroke={accent} strokeWidth="1.6" fill={accent} fillOpacity="0.08" />
          <line x1="88" y1="45" x2="88" y2="59" stroke={accent} strokeWidth="1.4" />
          <line x1="122" y1="45" x2="122" y2="59" stroke={accent} strokeWidth="1.4" />
          <circle cx="72" cy="86" r="17" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="72" cy="86" r="8" strokeOpacity="0.6" />
          <circle cx="176" cy="86" r="17" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="176" cy="86" r="8" strokeOpacity="0.6" />
        </g>
      );

    case 'pickup':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="104" x2="220" y2="104" strokeOpacity="0.22" strokeDasharray="3 4" />
          <path d="M28 86 L28 62 L106 62 L106 38 L154 38 L170 60 L206 64 Q214 66 214 75 L214 86" />
          <path d="M52 86 L190 86" />
          <path d="M90 62 L100 42 L106 42" stroke={accent} strokeWidth="1.6" />
          <path d="M114 45 L149 45 L161 60 L114 60 Z" stroke={accent} strokeWidth="1.6" fill={accent} fillOpacity="0.08" />
          <circle cx="68" cy="86" r="16" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="68" cy="86" r="7" strokeOpacity="0.55" />
          <circle cx="178" cy="86" r="16" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="178" cy="86" r="7" strokeOpacity="0.55" />
        </g>
      );

    case 'tractor':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="106" x2="220" y2="106" strokeOpacity="0.22" strokeDasharray="3 4" />
          <path d="M118 54 L182 58 L186 78 L118 82 Z" />
          <path d="M168 56 L168 28 L176 24" stroke={accent} strokeWidth="2" />
          <path d="M62 66 L70 30 L118 30 L118 68" stroke={accent} strokeWidth="1.8" fill={accent} fillOpacity="0.07" />
          <circle cx="80" cy="80" r="24" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="80" cy="80" r="13" stroke={accent} strokeWidth="1.6" />
          <circle cx="80" cy="80" r="4" fill={accent} />
          <circle cx="174" cy="91" r="13" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="174" cy="91" r="5" strokeOpacity="0.55" />
        </g>
      );

    case 'motorcycle':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="24" y1="104" x2="216" y2="104" strokeOpacity="0.22" strokeDasharray="3 4" />
          <path d="M64 84 L96 58 L138 52 L162 42 L176 84" />
          <path d="M88 54 L118 54 Q134 46 150 52 L144 64 L108 66 Z" stroke={accent} strokeWidth="1.7" fill={accent} fillOpacity="0.1" />
          <rect x="104" y="66" width="28" height="18" rx="4" strokeOpacity="0.7" />
          <circle cx="64" cy="84" r="18" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="64" cy="84" r="7" strokeOpacity="0.55" />
          <circle cx="176" cy="84" r="18" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="176" cy="84" r="7" strokeOpacity="0.55" />
        </g>
      );

    case 'villa':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="104" x2="218" y2="104" strokeOpacity="0.25" />
          <rect x="44" y="58" width="152" height="46" />
          <rect x="74" y="30" width="96" height="28" stroke={accent} strokeWidth="1.8" fill={accent} fillOpacity="0.08" />
          <line x1="62" y1="30" x2="184" y2="30" strokeWidth="2.4" />
          <line x1="36" y1="58" x2="204" y2="58" strokeWidth="2.2" />
          <rect x="58" y="70" width="38" height="22" strokeOpacity="0.6" />
          <rect x="110" y="70" width="24" height="34" stroke={accent} strokeWidth="1.7" />
          <rect x="148" y="70" width="34" height="22" strokeOpacity="0.6" />
        </g>
      );

    case 'apartment':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="104" x2="218" y2="104" strokeOpacity="0.25" />
          <rect x="54" y="26" width="84" height="78" />
          <rect x="138" y="48" width="48" height="56" strokeOpacity="0.65" />
          {[38, 56, 74].map((y) => (
            <React.Fragment key={y}>
              <rect x="66" y={y} width="16" height="10" stroke={accent} strokeWidth="1.4" fill={accent} fillOpacity="0.1" />
              <rect x="92" y={y} width="16" height="10" stroke={accent} strokeWidth="1.4" fill={accent} fillOpacity="0.1" />
            </React.Fragment>
          ))}
          <rect x="150" y="60" width="22" height="10" strokeOpacity="0.45" strokeWidth="1.4" />
          <rect x="88" y="88" width="18" height="16" stroke={accent} />
        </g>
      );

    case 'office':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="104" x2="218" y2="104" strokeOpacity="0.25" />
          <path d="M76 104 L76 26 L138 18 L138 104" />
          <path d="M138 36 L176 42 L176 104" strokeOpacity="0.7" />
          <path d="M50 104 L50 56 L76 56" strokeOpacity="0.55" />
          {[36, 48, 60, 72, 84].map((y) => (
            <line key={y} x1="84" y1={y} x2="130" y2={y - 3} stroke={accent} strokeWidth="1.4" strokeOpacity="0.75" />
          ))}
          <line x1="107" y1="22" x2="107" y2="104" strokeOpacity="0.3" strokeWidth="1.3" />
        </g>
      );

    case 'land':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="120,28 202,60 120,94 38,60" stroke={accent} strokeWidth="2" fill={accent} fillOpacity="0.08" />
          <line x1="79" y1="44" x2="161" y2="77" strokeOpacity="0.3" strokeDasharray="4 4" />
          <line x1="161" y1="44" x2="79" y2="77" strokeOpacity="0.3" strokeDasharray="4 4" />
          <circle cx="120" cy="28" r="4" fill={accent} stroke="none" />
          <circle cx="202" cy="60" r="4" fill={accent} stroke="none" />
          <circle cx="120" cy="94" r="4" fill={accent} stroke="none" />
          <circle cx="38" cy="60" r="4" fill={accent} stroke="none" />
        </g>
      );

    case 'gold':
      return (
        <g fill="none" stroke={goldStroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="28" y1="102" x2="212" y2="102" stroke={stroke} strokeOpacity="0.2" />
          <polygon points="46,96 58,72 108,72 118,96" fill={goldStroke} fillOpacity="0.1" />
          <polygon points="122,96 132,72 182,72 194,96" fill={goldStroke} fillOpacity="0.1" />
          <polygon points="84,72 96,46 144,46 156,72" fill={goldStroke} fillOpacity="0.18" />
          <text x="120" y="65" textAnchor="middle" fill={goldStroke} stroke="none" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            999.9
          </text>
        </g>
      );

    case 'silver':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="26" y1="102" x2="214" y2="102" strokeOpacity="0.22" />
          {/* Precision Stacked 1kg Silver Ingot Bricks */}
          <polygon points="44,96 56,74 114,74 126,96" fill="currentColor" fillOpacity="0.06" />
          <polygon points="118,96 130,74 188,74 200,96" fill="currentColor" fillOpacity="0.06" />
          <polygon points="80,74 92,50 150,50 162,74" stroke={accent} fill={accent} fillOpacity="0.1" />
          <text x="121" y="66" textAnchor="middle" fill={accent} stroke="none" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            AG 999
          </text>
        </g>
      );

    case 'coin_vault':
      return (
        <g fill="none" stroke={goldStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Sovereign Bullion Coins & Reserve Stack */}
          <circle cx="96" cy="62" r="30" fill={goldStroke} fillOpacity="0.1" />
          <circle cx="96" cy="62" r="22" strokeOpacity="0.5" strokeDasharray="3 3" />
          <path d="M132 48 C132 42 182 42 182 48 L182 88 C182 94 132 94 132 88 Z" stroke={stroke} fill="currentColor" fillOpacity="0.05" />
          <ellipse cx="157" cy="48" rx="25" ry="6" stroke={goldStroke} fill={goldStroke} fillOpacity="0.15" />
          <path d="M132 62 C132 68 182 68 182 62" strokeOpacity="0.5" stroke={stroke} />
          <path d="M132 76 C132 82 182 82 182 76" strokeOpacity="0.5" stroke={stroke} />
        </g>
      );

    case 'shop':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="104" x2="218" y2="104" strokeOpacity="0.25" />
          <rect x="46" y="48" width="148" height="56" />
          <path d="M40 48 L52 32 L188 32 L200 48 Z" stroke={accent} strokeWidth="1.8" fill={accent} fillOpacity="0.1" />
          <rect x="60" y="60" width="68" height="30" strokeOpacity="0.6" />
          <rect x="142" y="60" width="38" height="44" stroke={accent} />
        </g>
      );

    case 'bank_vault':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="120,24 192,48 48,48" stroke={accent} fill={accent} fillOpacity="0.09" />
          <line x1="42" y1="102" x2="198" y2="102" strokeWidth="2.4" />
          <line x1="50" y1="94" x2="190" y2="94" strokeOpacity="0.5" />
          {[68, 102, 138, 172].map((x) => (
            <line key={x} x1={x} y1="48" x2={x} y2="94" strokeWidth="2.4" />
          ))}
        </g>
      );

    case 'cnc_machine':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="104" x2="218" y2="104" strokeOpacity="0.25" />
          {/* 5-Axis Industrial CNC Enclosure + Spindle Head + Control Console */}
          <rect x="42" y="26" width="116" height="78" rx="4" />
          <rect x="54" y="38" width="66" height="46" rx="2" stroke={accent} fill={accent} fillOpacity="0.08" />
          {/* Vertical Milling Spindle */}
          <path d="M80 38 L80 56 L87 64 L94 56 L94 38" stroke={accent} strokeWidth="1.8" />
          <line x1="62" y1="74" x2="112" y2="74" strokeWidth="2" />
          {/* Side Operator Control Arm */}
          <rect x="166" y="42" width="34" height="42" rx="3" strokeOpacity="0.8" />
          <rect x="172" y="49" width="22" height="14" stroke={accent} strokeWidth="1.4" />
          <line x1="158" y1="62" x2="166" y2="62" />
        </g>
      );

    case 'crane':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="106" x2="220" y2="106" strokeOpacity="0.25" />
          {/* Lattice Tower Mast */}
          <rect x="64" y="34" width="16" height="72" />
          <path d="M64 48 L80 62 L64 76 L80 90 L64 104" strokeOpacity="0.5" strokeWidth="1.4" />
          {/* Horizontal Jib Boom & Counter-Jib */}
          <polygon points="32,34 204,34 196,42 32,42" stroke={accent} fill={accent} fillOpacity="0.09" />
          <path d="M72 18 L184 34 M72 18 L38 34" strokeOpacity="0.65" strokeWidth="1.5" />
          <line x1="72" y1="18" x2="72" y2="34" strokeWidth="2" />
          {/* Trolley & Hoist Hook */}
          <rect x="150" y="42" width="14" height="6" fill={accent} stroke="none" />
          <line x1="157" y1="48" x2="157" y2="74" stroke={accent} strokeWidth="1.6" />
          <path d="M153 74 A5 5 0 1 0 162 79" stroke={accent} strokeWidth="2" />
        </g>
      );

    case 'factory_unit':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="104" x2="220" y2="104" strokeOpacity="0.25" />
          {/* Sawtooth Industrial Manufacturing Shed + Silo/Chimney */}
          <path d="M36 104 L36 56 L76 38 L76 56 L116 38 L116 56 L156 38 L156 104 Z" />
          <rect x="166" y="26" width="22" height="78" strokeOpacity="0.75" />
          <line x1="166" y1="36" x2="188" y2="36" stroke={accent} strokeWidth="2" />
          {/* Loading Bays */}
          <rect x="52" y="72" width="32" height="32" stroke={accent} fill={accent} fillOpacity="0.08" />
          <rect x="104" y="72" width="32" height="32" stroke={accent} fill={accent} fillOpacity="0.08" />
        </g>
      );

    case 'psu_transformer':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="24" y1="104" x2="216" y2="104" strokeOpacity="0.25" />
          {/* High-Voltage Grid Substation Transformer + Ceramic Bushings */}
          <rect x="64" y="46" width="112" height="58" rx="3" />
          {/* Cooling Radiator Fins */}
          {[48, 56, 184, 192].map((x) => (
            <line key={x} x1={x} y1="54" x2={x} y2="96" strokeOpacity="0.65" strokeWidth="2.2" />
          ))}
          {/* 3 HV Insulator Bushings */}
          {[88, 120, 152].map((x) => (
            <g key={x} stroke={accent}>
              <line x1={x} y1="22" x2={x} y2="46" strokeWidth="2" />
              <line x1={x - 6} y1="28" x2={x + 6} y2="28" strokeWidth="1.6" />
              <line x1={x - 6} y1="35" x2={x + 6} y2="35" strokeWidth="1.6" />
            </g>
          ))}
          <polyline points="122,60 112,75 123,75 116,90" stroke={accent} strokeWidth="2.2" />
        </g>
      );

    case 'rail_scrap':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="100" x2="220" y2="100" strokeWidth="2.2" strokeOpacity="0.45" />
          {/* Freight Rail Wagon / Rolling Stock Silhouette */}
          <rect x="38" y="38" width="164" height="44" rx="4" />
          <line x1="78" y1="38" x2="78" y2="82" strokeOpacity="0.4" />
          <line x1="120" y1="38" x2="120" y2="82" strokeOpacity="0.4" />
          <line x1="162" y1="38" x2="162" y2="82" strokeOpacity="0.4" />
          <rect x="48" y="48" width="144" height="12" stroke={accent} fill={accent} fillOpacity="0.1" />
          {/* Bogie Wheels */}
          {[62, 86, 154, 178].map((cx) => (
            <circle key={cx} cx={cx} cy="91" r="8" className="fill-slate-100 dark:fill-slate-900" />
          ))}
        </g>
      );

    case 'solar_array':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="24" y1="104" x2="216" y2="104" strokeOpacity="0.25" />
          {/* Tilted Utility Photovoltaic Array */}
          <polygon points="44,74 72,34 196,34 168,74" stroke={accent} fill={accent} fillOpacity="0.1" />
          <line x1="58" y1="54" x2="182" y2="54" stroke={accent} strokeOpacity="0.55" strokeWidth="1.4" />
          <line x1="106" y1="34" x2="78" y2="74" stroke={accent} strokeOpacity="0.55" strokeWidth="1.4" />
          <line x1="146" y1="34" x2="118" y2="74" stroke={accent} strokeOpacity="0.55" strokeWidth="1.4" />
          {/* Support Stanchions */}
          <line x1="88" y1="74" x2="88" y2="104" strokeWidth="2.4" />
          <line x1="148" y1="74" x2="148" y2="104" strokeWidth="2.4" />
          <line x1="72" y1="104" x2="164" y2="104" strokeWidth="2.4" />
        </g>
      );

    case 'container_truck':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="102" x2="222" y2="102" strokeOpacity="0.22" strokeDasharray="3 4" />
          {/* 40ft Freight Container + Tractor Cab */}
          <rect x="26" y="34" width="128" height="52" rx="2" stroke={accent} fill={accent} fillOpacity="0.07" />
          {[52, 78, 104, 130].map((x) => (
            <line key={x} x1={x} y1="38" x2={x} y2="82" stroke={accent} strokeOpacity="0.35" strokeWidth="1.3" />
          ))}
          <path d="M160 86 L160 46 L192 46 L208 64 L212 86 Z" />
          <path d="M168 53 L190 53 L200 64 L168 64 Z" stroke={accent} strokeWidth="1.5" />
          {/* Multi-Axle Wheels */}
          {[52, 78, 176, 198].map((cx) => (
            <circle key={cx} cx={cx} cy="90" r="11" className="fill-slate-100 dark:fill-slate-900" />
          ))}
        </g>
      );

    case 'cargo_vessel':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Waterline */}
          <path d="M22 98 Q46 92 70 98 T118 98 T166 98 T214 98" stroke={accent} strokeOpacity="0.45" strokeWidth="1.6" />
          {/* Hull Silhouette */}
          <path d="M36 74 L208 74 L194 94 L48 94 Z" />
          {/* Bridge Superstructure */}
          <path d="M52 74 L52 44 L80 44 L84 74" />
          <rect x="58" y="34" width="16" height="10" strokeOpacity="0.7" />
          {/* Deck Container Stacks */}
          <rect x="92" y="56" width="32" height="18" stroke={accent} fill={accent} fillOpacity="0.1" />
          <rect x="128" y="48" width="32" height="26" stroke={accent} fill={accent} fillOpacity="0.1" />
          <rect x="164" y="60" width="24" height="14" strokeOpacity="0.65" />
        </g>
      );

    case 'forklift':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="104" x2="218" y2="104" strokeOpacity="0.22" />
          {/* Counterweight Body & Overhead Guard */}
          <path d="M52 88 L52 62 L126 62 L134 88 Z" />
          <path d="M68 62 L76 34 L118 34 L122 62" stroke={accent} fill={accent} fillOpacity="0.08" />
          {/* Vertical Mast & Lifting Forks */}
          <line x1="142" y1="24" x2="142" y2="94" strokeWidth="2.6" />
          <line x1="149" y1="28" x2="149" y2="94" strokeOpacity="0.5" strokeWidth="1.6" />
          <path d="M149 84 L194 84" stroke={accent} strokeWidth="2.6" />
          <rect x="156" y="60" width="32" height="24" stroke={accent} fill={accent} fillOpacity="0.12" />
          <circle cx="72" cy="90" r="12" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="122" cy="90" r="12" className="fill-slate-100 dark:fill-slate-900" />
        </g>
      );

    case 'laptops':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="60" y="28" width="120" height="56" rx="5" stroke={accent} fill={accent} fillOpacity="0.07" />
          <rect x="70" y="36" width="100" height="40" rx="2" strokeOpacity="0.35" strokeWidth="1.4" />
          <path d="M40 94 L60 84 L180 84 L200 94 Z" />
          <line x1="52" y1="102" x2="188" y2="102" strokeOpacity="0.4" />
        </g>
      );

    case 'generator':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="102" x2="218" y2="102" strokeOpacity="0.25" />
          <rect x="44" y="40" width="152" height="54" rx="4" />
          {[56, 66, 76, 86].map((x) => (
            <line key={x} x1={x} y1="52" x2={x} y2="82" strokeOpacity="0.45" strokeWidth="1.6" />
          ))}
          <rect x="136" y="50" width="46" height="32" rx="3" stroke={accent} fill={accent} fillOpacity="0.08" />
          <polyline points="161,56 154,67 162,67 156,77" stroke={accent} strokeWidth="1.9" />
          <path d="M108 40 L108 26 L134 26 L134 40" strokeOpacity="0.7" />
        </g>
      );

    case 'medical':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="104" x2="218" y2="104" strokeOpacity="0.25" />
          <rect x="116" y="28" width="66" height="76" rx="8" />
          <circle cx="149" cy="60" r="21" stroke={accent} strokeWidth="2" fill={accent} fillOpacity="0.09" />
          <path d="M44 74 L138 74 L138 82 L44 82 Z" />
          <rect x="64" y="82" width="32" height="22" strokeOpacity="0.65" />
          <polyline points="50,50 64,50 70,38 78,60 84,48 98,48" stroke={accent} strokeWidth="1.6" />
        </g>
      );

    case 'chronograph':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Mechanical Watch Straps & Case */}
          <path d="M104 16 L136 16 L132 34 L108 34 Z" strokeOpacity="0.6" />
          <path d="M108 90 L132 90 L136 108 L104 108 Z" strokeOpacity="0.6" />
          <circle cx="120" cy="62" r="30" />
          <circle cx="120" cy="62" r="24" stroke={goldStroke} fill={goldStroke} fillOpacity="0.08" />
          {/* Crown & Chronograph Pushers */}
          <rect x="150" y="57" width="6" height="10" rx="1" stroke={goldStroke} />
          <line x1="146" y1="44" x2="152" y2="40" strokeWidth="2.2" />
          <line x1="146" y1="80" x2="152" y2="84" strokeWidth="2.2" />
          {/* Hands & Subdials */}
          <line x1="120" y1="62" x2="120" y2="44" strokeWidth="2" />
          <line x1="120" y1="62" x2="133" y2="66" stroke={goldStroke} strokeWidth="2" />
          <circle cx="110" cy="68" r="5" strokeOpacity="0.45" strokeWidth="1.2" />
          <circle cx="130" cy="68" r="5" strokeOpacity="0.45" strokeWidth="1.2" />
        </g>
      );

    case 'fine_art':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Gallery Framed Canvas with Geometric Composition */}
          <rect x="52" y="20" width="136" height="84" rx="2" />
          <rect x="62" y="30" width="116" height="64" strokeOpacity="0.55" />
          <circle cx="96" cy="54" r="14" stroke={accent} fill={accent} fillOpacity="0.14" />
          <polygon points="74,86 116,52 146,86" stroke={goldStroke} fill={goldStroke} fillOpacity="0.12" />
          <line x1="138" y1="44" x2="164" y2="44" strokeOpacity="0.6" />
          <line x1="144" y1="54" x2="164" y2="54" strokeOpacity="0.45" />
        </g>
      );

    case 'vintage_car':
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="104" x2="220" y2="104" strokeOpacity="0.22" strokeDasharray="3 4" />
          {/* Long-Hood Fastback Collector GT Coupe */}
          <path d="M30 86 Q34 72 54 68 L74 48 Q90 38 116 40 Q132 42 144 58 L196 62 Q212 66 212 78 L210 86" />
          <path d="M56 86 L184 86" />
          <path d="M74 62 L90 46 Q112 44 128 58 L128 62 Z" stroke={goldStroke} strokeWidth="1.6" fill={goldStroke} fillOpacity="0.12" />
          {/* Wire-spoke collector wheels */}
          <circle cx="68" cy="86" r="15" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="68" cy="86" r="8" stroke={goldStroke} strokeDasharray="2 2" />
          <circle cx="176" cy="86" r="15" className="fill-slate-100 dark:fill-slate-900" />
          <circle cx="176" cy="86" r="8" stroke={goldStroke} strokeDasharray="2 2" />
        </g>
      );
  }
}

export const AssetIllustration: React.FC<AssetIllustrationProps> = ({
  assetType,
  size = 'md',
  className = '',
}) => {
  const sizeClass =
    size === 'xs'
      ? 'h-11 w-16 rounded-lg'
      : size === 'sm'
        ? 'h-16 w-24 rounded-xl'
        : size === 'lg'
          ? 'h-44 sm:h-52 w-full rounded-xl'
          : 'h-32 w-full rounded-xl';

  const bgClass = ACCENT_BG[assetType] ?? 'bg-slate-100/90 dark:bg-slate-900/90';

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-slate-200/80 dark:border-slate-800/90 ${bgClass} ${sizeClass} ${className}`}
      role="img"
      aria-label={`${SUBTYPE_LABELS[assetType]} technical illustration`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.09]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: size === 'xs' || size === 'sm' ? '12px 12px' : '22px 22px',
        }}
      />
      <svg
        viewBox="0 0 240 124"
        className="relative z-10 h-full w-full max-w-[260px] p-1.5 text-slate-800 dark:text-slate-200"
        preserveAspectRatio="xMidYMid meet"
      >
        {renderVectorGraphic(assetType)}
      </svg>
    </div>
  );
};
