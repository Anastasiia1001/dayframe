import { PlushMascot } from "./PlushMascot";
import { PugMascot } from "./PugMascot";
import type { MascotId } from "../appearance";
export function Mascot({ kind }: { kind: MascotId }) {
  return kind === "pug" ? <PugMascot /> : <PlushMascot kind={kind} />;
}
