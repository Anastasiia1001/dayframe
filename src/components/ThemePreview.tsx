import { useId } from "react";
import { themes } from "../appearance";

/** Decorative, self-contained artwork: never inherits the currently selected palette. */
export function ThemePreview({ id }: { id: string }) {
  const uid = useId().replace(/:/g, ""), t = themes.find(t => t.id === id) || themes[0];
  const night = ["Dark", "Moonlight", "NeonAzure", "NeonOcean", "NeonCobalt", "NeonAurora"].includes(id);
  const secondary: Record<string, string> = { Pastel: "#d7b3cc", CutePlanner: "#e7b692", Vintage: "#ac9766", Parchment: "#b69251", NeonAzure: "#8176ec", NeonOcean: "#277e9f", NeonCobalt: "#bf77ee", NeonAurora: "#9a7ce5", NeonIce: "#88c5e5", Default: "#df9ab4", Graphite: "#a6b5b1", Blue: "#a1c6db", Green: "#a7bb7e", Purple: "#c4a3cf", Warm: "#d6ad74", Dark: "#7b9382", Blossom: "#d9a0bb", Strawberry: "#91aa79", Pistachio: "#c6ae7c", Peach: "#e7b8ad", Blueberry: "#acb3db", Lagoon: "#8bc6b3", Moonlight: "#778bb9" };
  const other = secondary[id] || t.accent;
  if (id === "Autumn" || id === "Halloween") return <span className="theme-art" aria-hidden="true" data-art={id} style={{ background: id === "Autumn" ? "#f4e4cb" : "#28213e" }}><img src={`${import.meta.env.BASE_URL}assets/seasonal/${id.toLowerCase()}.svg`} alt="" /></span>;
  const flowers = ["Default", "Purple", "Blossom"].includes(id);
  const fruits = ["Strawberry", "Pistachio", "Peach", "Blueberry"].includes(id);
  const waves = ["Lagoon", "NeonOcean", "Blue"].includes(id);
  const neon = id.startsWith("Neon");
  const book = ["Vintage", "Parchment", "CutePlanner"].includes(id);
  return <span className="theme-art" aria-hidden="true" data-art={id}>
    <svg viewBox="0 0 320 140" fill="none" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${uid}sky`} x2="1" y2="1"><stop stopColor={t.background}/><stop offset="1" stopColor={other} stopOpacity={night ? ".35" : ".28"}/></linearGradient>
        <linearGradient id={`${uid}object`} x2=".8" y2="1"><stop stopColor={other}/><stop offset="1" stopColor={t.accent}/></linearGradient>
        <radialGradient id={`${uid}halo`}><stop stopColor={other} stopOpacity=".45"/><stop offset="1" stopColor={other} stopOpacity="0"/></radialGradient>
        <g id={`${uid}star`}><path d="M0-5L1.5-1.5L5 0L1.5 1.5L0 5L-1.5 1.5L-5 0L-1.5-1.5Z" fill={night ? "#f8e8b9" : other}/></g>
        <g id={`${uid}flower`}><path d="M0 0C-23-7-14-26 0-14C15-28 25-6 11 0C27 14 6 26 0 13C-14 28-29 10-13 1Z" fill={`url(#${uid}object)`}/><circle r="5" fill="#ffe6ac"/><circle cx="-1" cy="-1" r="2" fill="#fff5d7"/></g>
      </defs>
      <path d="M0 0H320V140H0Z" fill={t.background}/><path d="M0 0H320V140H0Z" fill={`url(#${uid}sky)`}/>
      <ellipse cx="242" cy="66" rx="115" ry="90" fill={`url(#${uid}halo)`}/>
      <path d="M0 116Q66 89 134 115T320 104V140H0Z" fill={other} opacity=".12"/>
      <path d="M0 133Q95 112 169 128T320 119" stroke={t.accent} opacity=".16"/>
      {neon && !waves ? <>
        <path d="M0 118L81 55L132 104L204 31L320 123" stroke={t.accent} strokeWidth="1.6" opacity=".65"/>
        <path d="M0 123L81 66L132 113L204 43L320 129" stroke={other} strokeWidth="1.2" opacity=".5"/>
        {id === "NeonAurora" ? <><path d="M40 0Q104 118 174 18T317 22" stroke={t.accent} strokeWidth="22" opacity=".13"/><path d="M40 0Q104 98 174 8T317 12" stroke={other} strokeWidth="10" opacity=".27"/></> : <circle cx="240" cy="39" r="21" stroke={t.accent} strokeWidth="2" opacity=".8"/>}
        {[0,1,2,3,4].map(i=><path key={i} d={`M${35+i*60} 140L160 96`} stroke={t.accent} opacity=".14"/>)}
      </> : waves ? <>
        <circle cx="244" cy="40" r="20" fill={night ? "#d8f7e9" : "#efd3a0"}/>
        {[0,1,2].map(i=><path key={i} d={`M0 ${86+i*17}Q44 ${63+i*17} 100 ${86+i*17}T210 ${86+i*17}T320 ${86+i*17}V140H0Z`} fill={i===1?other:t.accent} opacity={.12+i*.08}/>)}
        <path d="M222 100H265M232 108H255M238 116H250" stroke="#fff7df" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
      </> : flowers ? <>
        <path d="M206 141Q224 95 251 50M223 115Q204 86 184 81M240 76Q265 72 282 58" stroke={t.accent} strokeWidth="2" opacity=".5"/>
        <path d="M219 116Q184 122 190 101Q211 98 219 116M243 91Q273 96 272 76Q251 74 243 91" fill={other} opacity=".6"/>
        <use href={`#${uid}flower`} transform="translate(252 48) scale(1.15) rotate(15)"/><use href={`#${uid}flower`} transform="translate(183 79) scale(.65) rotate(-23)"/><use href={`#${uid}flower`} transform="translate(282 57) scale(.5)"/>
        <use href={`#${uid}flower`} transform="translate(57 39) scale(.32) rotate(30)" opacity=".65"/>
      </> : book ? <>
        <g transform="translate(216 77) rotate(-12)"><ellipse cy="38" rx="55" ry="7" fill={t.accent} opacity=".12"/><rect x="-40" y="-35" width="77" height="70" rx="7" fill={`url(#${uid}object)`}/><path d="M-31-33V33" stroke="#fff0c4" opacity=".45"/><rect x="-24" y="-26" width="51" height="50" rx="4" fill="#fff1d3"/><path d="M-14-12H17M-14-3H17M-14 6H7" stroke={t.accent} opacity=".3" strokeLinecap="round"/><path d="M9 11V40L16 35L23 40V11" fill={other}/></g>
        {id === "Parchment" ? <><use href={`#${uid}star`} transform="translate(263 27) scale(1.5)"/><path d="M87 95Q92 54 119 39Q118 66 96 81" fill={other} opacity=".65"/><path d="M89 103L112 51" stroke={t.accent}/></> : <path d="M68 102Q78 61 104 49Q111 76 88 86M78 80Q60 61 61 45Q85 48 86 65" fill={other} opacity=".6"/>}
      </> : fruits ? <>
        <ellipse cx="238" cy="113" rx="53" ry="7" fill={t.accent} opacity=".1"/>
        {id === "Strawberry" ? <><path d="M206 59Q236 39 263 61Q273 84 238 112Q202 91 206 59Z" fill={`url(#${uid}object)`}/><path d="M235 63L211 50L229 49L237 37L243 50L261 51L242 66Z" fill={other}/>{[0,1,2,3,4,5].map(i=><ellipse key={i} cx={220+i%3*15} cy={72+Math.floor(i/3)*17} rx="1.5" ry="2.3" fill="#ffe2bb"/>)}</> : id === "Peach" ? <><path d="M238 54C273 31 289 105 249 113C203 123 194 59 225 52Z" fill={`url(#${uid}object)`}/><path d="M238 57Q227 83 240 106" stroke="#f8d1ba" strokeWidth="2"/><path d="M238 52Q247 24 269 35Q262 53 238 52" fill="#839b6e"/></> : id === "Blueberry" ? <><circle cx="220" cy="85" r="24" fill={other}/><circle cx="252" cy="89" r="25" fill={`url(#${uid}object)`}/><path d="M244 69L251 74L259 70L257 79L248 80Z" fill="#48456c"/><path d="M229 58Q235 30 257 38Q249 58 229 58" fill="#9aa87d"/></> : <><ellipse cx="237" cy="85" rx="40" ry="29" fill="#d8b68a"/><ellipse cx="237" cy="79" rx="38" ry="27" fill="#edcf9f"/>{[0,1,2,3,4].map(i=><ellipse key={i} cx={214+(i%3)*21} cy={69+Math.floor(i/3)*18} rx="6" ry="3" transform={`rotate(-28 ${214+(i%3)*21} ${69+Math.floor(i/3)*18})`} fill={t.accent} opacity=".8"/>)}</>}
        <use href={`#${uid}star`} transform="translate(70 49) scale(.8)"/>
      </> : id === "Moonlight" || id === "Dark" ? <>
        <path d="M238 22A37 37 0 1 0 273 78A33 33 0 0 1 238 22Z" fill="#f0dcad"/>
        <path d="M147 116Q158 99 172 104Q179 80 203 89Q225 88 227 111Q244 111 245 123H148Z" fill={other} opacity=".6"/>
        <use href={`#${uid}star`} transform="translate(74 44) scale(1.2)"/><use href={`#${uid}star`} transform="translate(291 33) scale(.6)"/>
      </> : id === "Green" ? <>
        <path d="M232 118Q228 73 246 32M232 93L209 70M234 75L262 54" stroke={t.accent} strokeWidth="2"/>
        <path d="M246 49Q229 22 251 15Q263 35 246 49M234 77Q252 39 272 46Q273 71 234 77M228 91Q192 92 193 66Q216 57 228 91" fill={`url(#${uid}object)`}/>
        <path d="M213 109H254L249 138H219Z" fill="#cfb58e"/>
      </> : <>
        {id === "Warm" ? <><ellipse cx="233" cy="113" rx="48" ry="6" fill={other} opacity=".3"/><path d="M209 66H258V95Q258 113 233 113Q209 113 209 95Z" fill={`url(#${uid}object)`}/><path d="M258 73Q285 69 278 90Q274 98 259 95" stroke={other} strokeWidth="6"/><ellipse cx="233" cy="66" rx="24" ry="6" fill="#65452e"/><path d="M224 51Q214 39 226 29M242 49Q232 37 244 25" stroke={other} strokeWidth="2" strokeLinecap="round" opacity=".7"/></> : id === "Graphite" ? <><path d="M181 110L228 46L279 110Z" fill={other} opacity=".6"/><path d="M211 110L257 57L300 110Z" fill={t.accent} opacity=".3"/><circle cx="200" cy="38" r="15" fill={other}/><path d="M48 113H110M66 105H122" stroke={t.accent} opacity=".25"/></> : <><circle cx="242" cy="49" r="24" fill="#efc17e"/><path d="M181 93Q167 72 188 62Q189 39 213 46Q229 30 246 45Q266 47 263 69Q291 79 272 95Z" fill="#fff8ee"/><path d="M195 99H266" stroke={other} opacity=".5"/><path d="M65 58C46 44 33 66 65 83C96 66 82 44 65 58Z" fill={other} opacity=".7"/></>}
      </>}
      <use href={`#${uid}star`} transform="translate(153 34) scale(.65)" opacity=".7"/><circle cx="115" cy="93" r="1.6" fill={other}/><circle cx="290" cy="97" r="1.3" fill={t.accent} opacity=".5"/>
    </svg>
  </span>;
}
