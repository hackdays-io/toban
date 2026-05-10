import type * as React from "react";
import type { IconType } from "react-icons";
import {
  LuArrowRight,
  LuBell,
  LuChartPie,
  LuCheck,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuCopy,
  LuHeart,
  LuHouse,
  LuLogOut,
  LuMail,
  LuPencil,
  LuPlus,
  LuQrCode,
  LuSearch,
  LuSend,
  LuSettings,
  LuShield,
  LuSparkles,
  LuUser,
  LuUserCog,
  LuUserPlus,
  LuUsers,
  LuWallet,
  LuX,
} from "react-icons/lu";

import { cn } from "~/lib/utils";

// Curated alias map. The keys mirror the icon names used in the design source
// (`docs/design/handoff/project/primitives.jsx:6-37`); the values come from
// `react-icons/lu` so we stay aligned with the Lucide vocabulary the rest of
// the shadcn-derived primitives already depend on.
//
// Add new icons here as design needs grow rather than scattering raw imports
// across the app — that way Storybook/Ladle catalogs every icon the design
// system supports in one place.
const iconRegistry = {
  home: LuHouse,
  duty: LuUserCog,
  split: LuChartPie,
  members: LuUsers,
  wallet: LuWallet,
  bell: LuBell,
  search: LuSearch,
  plus: LuPlus,
  edit: LuPencil,
  gear: LuSettings,
  send: LuSend,
  mail: LuMail,
  check: LuCheck,
  "chevron-right": LuChevronRight,
  "chevron-left": LuChevronLeft,
  "chevron-down": LuChevronDown,
  close: LuX,
  "arrow-right": LuArrowRight,
  sparkle: LuSparkles,
  heart: LuHeart,
  shield: LuShield,
  user: LuUser,
  invite: LuUserPlus,
  copy: LuCopy,
  logout: LuLogOut,
  qr: LuQrCode,
  pie: LuChartPie,
} as const satisfies Record<string, IconType>;

type IconName = keyof typeof iconRegistry;

interface IconProps extends Omit<React.SVGAttributes<SVGElement>, "color"> {
  name: IconName;
  /** Pixel size — defaults to 22 to match the design source. */
  size?: number | string;
}

function Icon({ name, size = 22, className, ...rest }: IconProps) {
  const Cmp = iconRegistry[name];
  return (
    <Cmp
      data-slot="icon"
      data-name={name}
      size={size}
      className={cn("shrink-0", className)}
      {...rest}
    />
  );
}

export { Icon, iconRegistry };
export type { IconName, IconProps };
