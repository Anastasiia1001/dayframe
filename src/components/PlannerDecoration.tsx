import { isPlannerTheme } from "../appearance";
/** Small original stationery drawings. The calendar remains real, selectable UI. */
export function PlannerDecoration({ theme }: { theme: string }) {
  if (!isPlannerTheme(theme)) return null;
  return <svg className="planner-decoration" data-decoration={theme} viewBox="0 0 160 120" fill="none" aria-hidden="true" focusable="false">
    <defs><linearGradient id={`clay-${theme}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fffaf0"/><stop offset="1" stopColor="#e7cbb0"/></linearGradient></defs>
    {theme === "Pastel" && <>
      <ellipse cx="84" cy="108" rx="65" ry="7" fill="#705630" opacity=".1"/>
      <path d="M29 67H70L65 103Q50 112 34 103Z" fill="#e8ad90" stroke="#c28a6d"/>
      <path d="M49 68V24M49 53Q16 51 22 28Q49 29 49 53ZM49 40Q76 38 77 17Q52 17 49 40Z" fill="#83b5a5" stroke="#537f68" strokeWidth="2"/>
      <path d="M87 63H131V91Q130 105 109 105Q88 105 87 91Z" fill={`url(#clay-${theme})`} stroke="#c5a98b" strokeWidth="2"/>
      <path d="M131 70Q151 65 149 81Q146 95 132 89" stroke="#c5a98b" strokeWidth="5"/>
      <ellipse cx="109" cy="63" rx="22" ry="5" fill="#b28565"/>
      <path d="M105 49Q98 40 107 32M118 46Q126 36 119 25" stroke="#b9a28b" strokeWidth="2" strokeLinecap="round"/>
    </>}
    {theme === "CutePlanner" && <>
      <path d="M19 21L69 12L73 28L23 38Z" fill="#d4d5ad" opacity=".8"/>
      <path d="M27 21L31 36M41 18L45 33M55 16L59 31M21 28L70 20" stroke="#9baf8f" opacity=".5"/>
      <ellipse cx="81" cy="108" rx="49" ry="6" fill="#c28c91" opacity=".14"/>
      <ellipse cx="63" cy="42" rx="11" ry="29" transform="rotate(-12 63 42)" fill="#fff8e9" stroke="#c59b9c" strokeWidth="2"/>
      <ellipse cx="89" cy="40" rx="11" ry="29" transform="rotate(12 89 40)" fill="#fff8e9" stroke="#c59b9c" strokeWidth="2"/>
      <path d="M63 23L68 47M91 21L86 46" stroke="#f3c1bd" strokeWidth="7" strokeLinecap="round"/>
      <ellipse cx="77" cy="78" rx="36" ry="29" fill="#fff8e9" stroke="#c59b9c" strokeWidth="2"/>
      <circle cx="66" cy="73" r="2.5" fill="#654736"/><circle cx="89" cy="73" r="2.5" fill="#654736"/>
      <ellipse cx="53" cy="83" rx="7" ry="4" fill="#f3c1bd"/><ellipse cx="101" cy="83" rx="7" ry="4" fill="#f3c1bd"/>
      <path d="M73 82Q77 87 81 82M77 85Q74 91 71 87M77 85Q80 91 84 87" stroke="#654736" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M124 41C108 26 110 57 124 64C139 57 142 27 124 41Z" fill="#f3c1bd" stroke="#c8989c"/>
      <path d="M132 81L135 90L145 93L135 96L132 105L129 96L119 93L129 90Z" fill="#cab5d9"/>
    </>}
    {theme === "Vintage" && <g stroke="#786846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M40 109Q58 65 83 27M51 86Q22 80 29 61Q51 62 57 74M65 63Q77 43 98 52Q89 72 65 63M73 43Q57 20 68 11Q86 25 82 31" fill="#a6aa8a"/>
      <path d="M87 35C61 17 80 0 95 17C113-2 129 19 105 34C111 54 86 59 87 35Z" fill="#bb9184"/>
      <path d="M92 28Q78 16 89 14Q108 10 105 26Q101 40 91 33Q84 24 97 23"/>
      <circle cx="119" cy="85" r="23" fill="#c9b18a"/><circle cx="119" cy="85" r="18" fill="#f4e9d0"/>
      <path d="M113 60V54H125V60M119 72V85L130 92M119 69V71M119 99V101M103 85H105M133 85H135"/>
      <path d="M24 102Q36 87 39 61M19 85L38 67M21 69L39 75"/>
    </g>}
    {theme === "Parchment" && <g stroke="#604827" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M19 79L70 70L121 81L75 98Z" fill="#6d3429"/><path d="M21 84L73 77L116 85V100L74 112L20 99Z" fill="#b99049"/>
      <path d="M25 85L73 92L113 84V97L74 108L25 96Z" fill="#efdbab"/><path d="M33 91L70 97M34 96L71 102M81 98L106 92M74 92V108"/>
      <path d="M74 86Q96 30 142 9Q151 45 112 66L89 74Z" fill="#efdbab"/><path d="M79 86L142 9M99 59L125 43M106 50L106 37M118 36L137 30"/>
      <path d="M37 22L40 31L49 34L40 37L37 46L34 37L25 34L34 31ZM70 8L73 14L79 17L73 20L70 26L67 20L61 17L67 14Z" fill="#b99049"/>
      <path d="M124 86H145L150 108H120Z" fill="#414a32"/><path d="M126 82H143V89H126Z" fill="#b99049"/>
    </g>}
  </svg>;
}
