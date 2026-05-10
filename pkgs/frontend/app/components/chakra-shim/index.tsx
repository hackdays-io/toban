/**
 * Chakra-shim — Phase 1-2 transitional polyfill.
 *
 * Issue #420 removes Chakra UI but leaves ~77 callsites that import
 * primitives like Box / Flex / HStack / VStack / Text / Heading / Container /
 * Stack / Grid / GridItem / Spinner / Skeleton / IconButton / Image / Input /
 * Icon from "~/components/chakra-shim". Mass-rewriting every callsite to Tailwind
 * className strings is Phase 3 work — for this phase we only need the app to
 * compile and boot.
 *
 * This module re-exports those primitive names backed by Tailwind/HTML so
 * Chakra can be removed from package.json without touching call sites
 * structurally. Chakra's style-prop API (mt={3}, p={2}, w="100%", display=
 * "flex", etc.) is converted to inline `style` so layouts mostly survive.
 * Theme-aware props like bg="yellow.400" or color="gray.800" are silently
 * dropped — Phase 2-1 (#426) and Phase 3 will replace these with Tailwind
 * classes that consume the design tokens defined in app/styles/globals.css.
 */
import {
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type Ref,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const SPACE_UNIT = 4; // Chakra default spacing scale: 1 unit = 4px

const toLength = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === "number") return `${value * SPACE_UNIT}px`;
  if (typeof value === "string") return value;
  return undefined;
};

const passString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const passAny = <T,>(value: unknown): T | undefined =>
  value == null ? undefined : (value as T);

/**
 * Maps Chakra style-props → CSS properties. Anything not in this table is
 * forwarded to the rendered DOM element (or dropped if it's a Chakra-only
 * prop like `colorScheme` / `colorPalette` that has no HTML equivalent).
 */
const STYLE_PROP_HANDLERS: Record<string, (value: unknown) => CSSProperties> = {
  m: (v) => ({ margin: toLength(v) }),
  mt: (v) => ({ marginTop: toLength(v) }),
  mr: (v) => ({ marginRight: toLength(v) }),
  mb: (v) => ({ marginBottom: toLength(v) }),
  ml: (v) => ({ marginLeft: toLength(v) }),
  mx: (v) => ({ marginLeft: toLength(v), marginRight: toLength(v) }),
  my: (v) => ({ marginTop: toLength(v), marginBottom: toLength(v) }),
  marginStart: (v) => ({ marginInlineStart: toLength(v) }),
  marginEnd: (v) => ({ marginInlineEnd: toLength(v) }),
  ms: (v) => ({ marginInlineStart: toLength(v) }),
  me: (v) => ({ marginInlineEnd: toLength(v) }),

  p: (v) => ({ padding: toLength(v) }),
  pt: (v) => ({ paddingTop: toLength(v) }),
  pr: (v) => ({ paddingRight: toLength(v) }),
  pb: (v) => ({ paddingBottom: toLength(v) }),
  pl: (v) => ({ paddingLeft: toLength(v) }),
  px: (v) => ({ paddingLeft: toLength(v), paddingRight: toLength(v) }),
  py: (v) => ({ paddingTop: toLength(v), paddingBottom: toLength(v) }),
  ps: (v) => ({ paddingInlineStart: toLength(v) }),
  pe: (v) => ({ paddingInlineEnd: toLength(v) }),

  w: (v) => ({ width: toLength(v) }),
  width: (v) => ({ width: toLength(v) }),
  h: (v) => ({ height: toLength(v) }),
  height: (v) => ({ height: toLength(v) }),
  minW: (v) => ({ minWidth: toLength(v) }),
  minH: (v) => ({ minHeight: toLength(v) }),
  maxW: (v) => ({ maxWidth: toLength(v) }),
  maxH: (v) => ({ maxHeight: toLength(v) }),
  minWidth: (v) => ({ minWidth: toLength(v) }),
  minHeight: (v) => ({ minHeight: toLength(v) }),
  maxWidth: (v) => ({ maxWidth: toLength(v) }),
  maxHeight: (v) => ({ maxHeight: toLength(v) }),
  boxSize: (v) => ({ width: toLength(v), height: toLength(v) }),

  display: (v) => ({ display: passString(v) }),
  flex: (v) => ({ flex: passAny<string | number>(v) }),
  flexDirection: (v) => ({
    flexDirection: passAny<CSSProperties["flexDirection"]>(v),
  }),
  flexDir: (v) => ({
    flexDirection: passAny<CSSProperties["flexDirection"]>(v),
  }),
  direction: (v) => ({
    flexDirection: passAny<CSSProperties["flexDirection"]>(v),
  }),
  flexWrap: (v) => ({ flexWrap: passAny<CSSProperties["flexWrap"]>(v) }),
  flexGrow: (v) => ({ flexGrow: passAny<number>(v) }),
  flexShrink: (v) => ({ flexShrink: passAny<number>(v) }),
  justifyContent: (v) => ({ justifyContent: passString(v) }),
  justify: (v) => ({ justifyContent: passString(v) }),
  alignItems: (v) => ({ alignItems: passString(v) }),
  align: (v) => ({ alignItems: passString(v) }),
  alignSelf: (v) => ({ alignSelf: passString(v) }),
  alignContent: (v) => ({ alignContent: passString(v) }),
  gap: (v) => ({ gap: toLength(v) }),
  rowGap: (v) => ({ rowGap: toLength(v) }),
  columnGap: (v) => ({ columnGap: toLength(v) }),

  gridTemplateColumns: (v) => ({ gridTemplateColumns: passString(v) }),
  gridTemplateRows: (v) => ({ gridTemplateRows: passString(v) }),
  gridColumn: (v) => ({ gridColumn: passAny<string | number>(v) }),
  gridRow: (v) => ({ gridRow: passAny<string | number>(v) }),
  gridGap: (v) => ({ gap: toLength(v) }),
  gridArea: (v) => ({ gridArea: passString(v) }),
  templateColumns: (v) => ({ gridTemplateColumns: passString(v) }),
  templateRows: (v) => ({ gridTemplateRows: passString(v) }),

  position: (v) => ({ position: passAny<CSSProperties["position"]>(v) }),
  pos: (v) => ({ position: passAny<CSSProperties["position"]>(v) }),
  top: (v) => ({ top: toLength(v) }),
  right: (v) => ({ right: toLength(v) }),
  bottom: (v) => ({ bottom: toLength(v) }),
  left: (v) => ({ left: toLength(v) }),
  zIndex: (v) => ({ zIndex: passAny<number>(v) }),

  border: (v) => ({ border: passString(v) }),
  borderTop: (v) => ({ borderTop: passString(v) }),
  borderRight: (v) => ({ borderRight: passString(v) }),
  borderBottom: (v) => ({ borderBottom: passString(v) }),
  borderLeft: (v) => ({ borderLeft: passString(v) }),
  borderRadius: (v) => ({ borderRadius: toLength(v) }),
  rounded: (v) => ({ borderRadius: toLength(v) }),
  borderColor: (v) => ({ borderColor: passString(v) }),
  borderWidth: (v) => ({ borderWidth: toLength(v) }),
  borderStyle: (v) => ({
    borderStyle: passAny<CSSProperties["borderStyle"]>(v),
  }),

  fontSize: (v) => ({
    fontSize: typeof v === "string" ? v : toLength(v),
  }),
  fontWeight: (v) => ({
    fontWeight: passAny<CSSProperties["fontWeight"]>(v),
  }),
  fontFamily: (v) => ({ fontFamily: passString(v) }),
  lineHeight: (v) => ({
    lineHeight: passAny<CSSProperties["lineHeight"]>(v),
  }),
  letterSpacing: (v) => ({ letterSpacing: passString(v) }),
  textAlign: (v) => ({ textAlign: passAny<CSSProperties["textAlign"]>(v) }),
  textTransform: (v) => ({
    textTransform: passAny<CSSProperties["textTransform"]>(v),
  }),
  textDecoration: (v) => ({ textDecoration: passString(v) }),
  whiteSpace: (v) => ({ whiteSpace: passAny<CSSProperties["whiteSpace"]>(v) }),
  wordBreak: (v) => ({ wordBreak: passAny<CSSProperties["wordBreak"]>(v) }),

  cursor: (v) => ({ cursor: passString(v) }),
  overflow: (v) => ({ overflow: passString(v) }),
  overflowX: (v) => ({ overflowX: passAny<CSSProperties["overflowX"]>(v) }),
  overflowY: (v) => ({ overflowY: passAny<CSSProperties["overflowY"]>(v) }),
  opacity: (v) => ({ opacity: passAny<number>(v) }),
  visibility: (v) => ({
    visibility: passAny<CSSProperties["visibility"]>(v),
  }),
  pointerEvents: (v) => ({
    pointerEvents: passAny<CSSProperties["pointerEvents"]>(v),
  }),
  userSelect: (v) => ({
    userSelect: passAny<CSSProperties["userSelect"]>(v),
  }),

  boxShadow: (v) => ({ boxShadow: passString(v) }),
  shadow: (v) => ({ boxShadow: passString(v) }),
  objectFit: (v) => ({ objectFit: passAny<CSSProperties["objectFit"]>(v) }),
  transition: (v) => ({ transition: passString(v) }),
  transform: (v) => ({ transform: passString(v) }),
};

/**
 * Chakra props with no plain-CSS equivalent (or that are theme-token-shaped
 * like `bg="yellow.400"`). Listed explicitly so we can drop them silently
 * instead of forwarding them to the DOM and tripping React warnings.
 */
const DROPPED_PROPS = new Set([
  "bg",
  "bgColor",
  "background",
  "backgroundColor",
  "color",
  "colorScheme",
  "colorPalette",
  "variant",
  "loading",
  "isLoading",
  "isDisabled",
  "isInvalid",
  "isReadOnly",
  "isRequired",
  "isChecked",
  "isFocused",
  "as",
  "asChild",
  "spacing",
  "_hover",
  "_focus",
  "_active",
  "_disabled",
  "_checked",
  "_invalid",
  "_placeholder",
  "_dark",
  "_light",
  "_before",
  "_after",
  "_first",
  "_last",
  "_odd",
  "_even",
  "_groupHover",
  "sx",
  "css",
  "layerStyle",
  "textStyle",
  "apply",
  "outline",
  "outlineOffset",
  "ringColor",
  "ringWidth",
  "ringOffset",
  "field", // Chakra v3 Input slot recipe
  "recipe",
  "slotRecipe",
]);

type AnyProps = Record<string, unknown>;

/**
 * Explicit list of Chakra style props the codebase passes to layout / atom
 * primitives. Listing them (instead of using an index signature) keeps
 * properly typed props like `onChange` from being widened to `unknown` when
 * we intersect this with `ComponentPropsWithoutRef<"input">` etc.
 */
export interface ChakraStyleProps {
  m?: number | string;
  mt?: number | string;
  mr?: number | string;
  mb?: number | string;
  ml?: number | string;
  mx?: number | string;
  my?: number | string;
  ms?: number | string;
  me?: number | string;
  marginStart?: number | string;
  marginEnd?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
  marginY?: number | string;
  p?: number | string;
  pt?: number | string;
  pr?: number | string;
  pb?: number | string;
  pl?: number | string;
  px?: number | string;
  py?: number | string;
  ps?: number | string;
  pe?: number | string;
  w?: number | string;
  h?: number | string;
  width?: number | string;
  height?: number | string;
  minW?: number | string;
  minH?: number | string;
  maxW?: number | string;
  maxH?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  boxSize?: number | string;
  display?: string;
  flex?: string | number;
  flexDirection?: string;
  flexDir?: string;
  direction?: string;
  flexWrap?: string;
  flexGrow?: number;
  flexShrink?: number;
  justifyContent?: string;
  justify?: string;
  alignItems?: string;
  align?: string;
  alignSelf?: string;
  alignContent?: string;
  gap?: number | string;
  rowGap?: number | string;
  columnGap?: number | string;
  spacing?: number | string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumn?: string | number;
  gridRow?: string | number;
  gridGap?: number | string;
  gridArea?: string;
  templateColumns?: string;
  templateRows?: string;
  position?: string;
  pos?: string;
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  zIndex?: number;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRadius?: number | string;
  rounded?: number | string;
  borderColor?: string;
  borderWidth?: number | string;
  borderStyle?: string;
  bg?: string;
  bgColor?: string;
  background?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  lineHeight?: string | number;
  letterSpacing?: string;
  textAlign?: string;
  textTransform?: string;
  textDecoration?: string;
  whiteSpace?: string;
  wordBreak?: string;
  cursor?: string;
  overflow?: string;
  overflowX?: string;
  overflowY?: string;
  opacity?: number;
  visibility?: string;
  pointerEvents?: string;
  userSelect?: string;
  boxShadow?: string;
  shadow?: string;
  objectFit?: string;
  transition?: string;
  transform?: string;
  // Chakra namespaced state props (best-effort: any object).
  _hover?: Record<string, unknown>;
  _focus?: Record<string, unknown>;
  _active?: Record<string, unknown>;
  _disabled?: Record<string, unknown>;
  _checked?: Record<string, unknown>;
  _invalid?: Record<string, unknown>;
  _placeholder?: Record<string, unknown>;
  _dark?: Record<string, unknown>;
  _light?: Record<string, unknown>;
  _before?: Record<string, unknown>;
  _after?: Record<string, unknown>;
  _first?: Record<string, unknown>;
  _last?: Record<string, unknown>;
  _odd?: Record<string, unknown>;
  _even?: Record<string, unknown>;
  _groupHover?: Record<string, unknown>;
  // Misc Chakra-only props consumed and dropped by the shim.
  colorScheme?: string;
  colorPalette?: string;
  variant?: string;
  loading?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isChecked?: boolean;
  isFocused?: boolean;
  as?: ElementType | string;
  asChild?: boolean;
  sx?: Record<string, unknown>;
  css?: Record<string, unknown>;
  layerStyle?: string;
  textStyle?: string;
  apply?: string;
  outline?: string;
  outlineOffset?: number | string;
  ringColor?: string;
  ringWidth?: number | string;
  ringOffset?: number | string;
  field?: Record<string, unknown>;
  recipe?: unknown;
  slotRecipe?: unknown;
}

function splitProps(props: AnyProps): {
  style: CSSProperties;
  rest: AnyProps;
} {
  const style: CSSProperties = {};
  const rest: AnyProps = {};
  for (const key in props) {
    const value = props[key];
    const handler = STYLE_PROP_HANDLERS[key];
    if (handler) {
      Object.assign(style, handler(value));
    } else if (DROPPED_PROPS.has(key)) {
      // intentionally drop
    } else {
      rest[key] = value;
    }
  }
  return { style, rest };
}

/**
 * Build a forwardRef-ed Chakra-shaped component backed by a plain HTML tag.
 * baseStyle is merged in *before* user styles so callers can override.
 */
function makeBox<E extends ElementType>(Tag: E, baseStyle: CSSProperties = {}) {
  type Props = AnyProps & { children?: ReactNode };
  const Comp = forwardRef<HTMLElement, Props>(function Comp(props, ref) {
    const { style: chakraStyle, rest } = splitProps(props);
    const { style: userStyle, ...domProps } = rest as AnyProps & {
      style?: CSSProperties;
    };
    const Component = Tag as ElementType;
    return (
      <Component
        ref={ref as Ref<unknown>}
        style={{ ...baseStyle, ...chakraStyle, ...(userStyle ?? {}) }}
        {...(domProps as ComponentPropsWithoutRef<typeof Component>)}
      />
    );
  });
  return Comp;
}

// ───────────────────────────── Layout ─────────────────────────────

export const Box = makeBox("div");
export const Flex = makeBox("div", { display: "flex" });
export const HStack = makeBox("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "8px",
});
export const VStack = makeBox("div", {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
});
export const Stack = makeBox("div", {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});
export const Container = makeBox("div", {
  width: "100%",
  maxWidth: "430px",
  marginInline: "auto",
});
export const Center = makeBox("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});
export const AbsoluteCenter = makeBox("div", {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
});
export const Grid = makeBox("div", { display: "grid" });
export const GridItem = makeBox("div");
export const Group = makeBox("div", { display: "inline-flex" });

// ───────────────────────────── Typography ─────────────────────────

export const Text = makeBox("p", { margin: 0 });
export const Heading = makeBox("h2", { margin: 0, fontWeight: 700 });
export const Span = makeBox("span");

// ───────────────────────────── Media / atoms ──────────────────────

export const Image = makeBox("img");
export const Spinner = makeBox("div", {
  display: "inline-block",
  width: "20px",
  height: "20px",
  border: "2px solid currentColor",
  borderRightColor: "transparent",
  borderRadius: "50%",
  animation: "chakra-shim-spin 0.6s linear infinite",
});
export const Skeleton = makeBox("div", {
  display: "block",
  backgroundColor: "var(--color-border)",
  borderRadius: "8px",
  animation: "chakra-shim-pulse 1.5s ease-in-out infinite",
  minHeight: "1em",
});
export const Icon = makeBox("span", {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});
// Chakra v3 List is a compound: <List.Root> + <List.Item>. We expose both
// shapes (top-level component AND `.Root` / `.Item` namespace) so legacy
// call sites and Chakra-v3-style call sites both compile.
const ListRoot = makeBox("ul", { margin: 0, padding: 0 });
const ListItemImpl = makeBox("li");
export const List = Object.assign(ListRoot, {
  Root: ListRoot,
  Item: ListItemImpl,
});
export const ListItem = ListItemImpl;

// ───────────────────────────── Form atoms ─────────────────────────
// These are intentionally bare-bones — issue #426 will replace them with
// tokenised Shadcn primitives.

export const Button = makeBox("button", {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "8px 16px",
  borderRadius: "12px",
  backgroundColor: "var(--color-primary)",
  color: "var(--color-text-primary)",
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
});
export const IconButton = makeBox("button", {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  borderRadius: "9999px",
  backgroundColor: "transparent",
  cursor: "pointer",
  border: "none",
});
// Native input / textarea kept as their own forwardRef so call sites get
// proper event types (onChange's `e` is HTMLInputElement, not unknown).
// We intersect with the explicit ChakraStyleProps interface (NOT a string
// index signature) so DOM-typed callbacks like `onChange` survive.
type InputShimProps = ComponentPropsWithoutRef<"input"> & ChakraStyleProps;
export const Input = forwardRef<HTMLInputElement, InputShimProps>(
  function Input(props, ref) {
    const { style: chakraStyle, rest } = splitProps(
      props as unknown as AnyProps,
    );
    const { style: userStyle, ...domProps } = rest as AnyProps & {
      style?: CSSProperties;
    };
    return (
      <input
        ref={ref}
        style={{
          display: "block",
          width: "100%",
          padding: "10px 12px",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-primary)",
          outline: "none",
          ...chakraStyle,
          ...(userStyle ?? {}),
        }}
        {...(domProps as ComponentPropsWithoutRef<"input">)}
      />
    );
  },
);

type TextareaShimProps = ComponentPropsWithoutRef<"textarea"> &
  ChakraStyleProps;
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaShimProps>(
  function Textarea(props, ref) {
    const { style: chakraStyle, rest } = splitProps(
      props as unknown as AnyProps,
    );
    const { style: userStyle, ...domProps } = rest as AnyProps & {
      style?: CSSProperties;
    };
    return (
      <textarea
        ref={ref}
        style={{
          display: "block",
          width: "100%",
          padding: "10px 12px",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-primary)",
          outline: "none",
          fontFamily: "inherit",
          ...chakraStyle,
          ...(userStyle ?? {}),
        }}
        {...(domProps as ComponentPropsWithoutRef<"textarea">)}
      />
    );
  },
);
export const InputElement = makeBox("div", {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  position: "absolute",
  top: 0,
  bottom: 0,
});

// ───────────────────────────── Compound stubs ─────────────────────
// Chakra v3 NumberInput uses a Root/Input/Control/IncrementTrigger/
// DecrementTrigger compound. Render the input, drop the +/- triggers.

interface NumberInputRootProps extends ChakraStyleProps {
  value?: string;
  defaultValue?: string;
  // Chakra v3 details signature: { value: string, valueAsNumber: number }.
  onValueChange?: (details: { value: string; valueAsNumber?: number }) => void;
  children?: ReactNode;
  min?: number;
  max?: number;
  step?: number;
  inputMode?: "numeric" | "decimal" | "text";
  formatOptions?: Intl.NumberFormatOptions;
  allowMouseWheel?: boolean;
}
const NumberInputRoot = forwardRef<HTMLDivElement, NumberInputRootProps>(
  function NumberInputRoot(
    { value, defaultValue, onValueChange, children, ...rest },
    ref,
  ) {
    // Forward value/onChange via React context so the inner Input can wire up.
    return (
      <NumberInputCtx.Provider value={{ value, defaultValue, onValueChange }}>
        <Box ref={ref} {...rest}>
          {children}
        </Box>
      </NumberInputCtx.Provider>
    );
  },
);
const NumberInputCtx = createContext<{
  value?: string;
  defaultValue?: string;
  onValueChange?: (details: { value: string; valueAsNumber?: number }) => void;
}>({});
const NumberInputInput = forwardRef<HTMLInputElement, AnyProps>(
  function NumberInputInput(props, ref) {
    const ctx = useContext(NumberInputCtx);
    const { style: chakraStyle, rest } = splitProps(props);
    const { style: userStyle, ...domProps } = rest as AnyProps & {
      style?: CSSProperties;
    };
    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={ctx.value}
        defaultValue={ctx.defaultValue}
        onChange={(e) =>
          ctx.onValueChange?.({
            value: e.target.value,
            valueAsNumber: Number(e.target.value),
          })
        }
        style={{
          display: "block",
          width: "100%",
          padding: "10px 12px",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          outline: "none",
          ...chakraStyle,
          ...(userStyle ?? {}),
        }}
        {...(domProps as ComponentPropsWithoutRef<"input">)}
      />
    );
  },
);
const NumberInputControl = (_: { children?: ReactNode }) => null;
const NumberInputIncrementTrigger = () => null;
const NumberInputDecrementTrigger = () => null;
export const NumberInput = Object.assign(NumberInputRoot, {
  Root: NumberInputRoot,
  Input: NumberInputInput,
  Control: NumberInputControl,
  IncrementTrigger: NumberInputIncrementTrigger,
  DecrementTrigger: NumberInputDecrementTrigger,
});

// Tabs compound: render content unconditionally so the page still functions.
const TabsRoot = makeBox("div");
const TabsList = makeBox("div", { display: "flex", gap: "8px" });
const TabsTrigger = makeBox("button", {
  padding: "8px 12px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
});
const TabsContent = makeBox("div");
export const Tabs = Object.assign(TabsRoot, {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});

// ───────────────────────────── Slider ─────────────────────────────
// Splits / AssistCredit pages use Chakra v3's `useSlider` + Slider.RootProvider
// compound. We provide a tiny equivalent backed by a native range input so
// the Splits ratio editor and the Thanks amount picker keep functioning.
// Phase 2-1 (#426) replaces this with the proper Shadcn Slider.

export interface SliderApi {
  value: number[];
  setValue: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
}

export interface UseSliderOptions {
  defaultValue?: number[];
  value?: number[];
  onValueChange?: (details: { value: number[] }) => void;
  min?: number;
  max?: number;
  step?: number;
  // Chakra-only options consumed and ignored.
  thumbAlignment?: string;
  origin?: string;
  orientation?: string;
}

export function useSlider(opts: UseSliderOptions = {}): SliderApi {
  const {
    defaultValue = [0],
    value: controlled,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
  } = opts;
  const [internal, setInternal] = useState<number[]>(defaultValue);
  const value = controlled ?? internal;
  const setValue = useCallback(
    (next: number[]) => {
      if (controlled === undefined) setInternal(next);
      onValueChange?.({ value: next });
    },
    [controlled, onValueChange],
  );
  return useMemo(
    () => ({ value, setValue, min, max, step }),
    [value, setValue, min, max, step],
  );
}

const SliderApiContext = createContext<SliderApi | null>(null);

const useSliderApi = () => {
  const api = useContext(SliderApiContext);
  if (!api) {
    throw new Error("Slider compound used outside <Slider.RootProvider>");
  }
  return api;
};

interface SliderRootProviderProps extends ChakraStyleProps {
  value: SliderApi;
  size?: string;
  children?: ReactNode;
  onChange?: () => void;
}

const SliderRootProvider = ({ value, children }: SliderRootProviderProps) => (
  <SliderApiContext.Provider value={value}>
    <div style={{ position: "relative", width: "100%" }}>{children}</div>
  </SliderApiContext.Provider>
);

const SliderControl = ({ children }: { children?: ReactNode }) => (
  <div style={{ position: "relative", width: "100%" }}>{children}</div>
);

type SliderTrackProps = {
  children?: ReactNode;
  backgroundColor?: string;
};

const SliderTrack = ({ children, backgroundColor }: SliderTrackProps) => {
  const api = useSliderApi();
  return (
    <div
      style={{
        position: "relative",
        height: "8px",
        borderRadius: "9999px",
        backgroundColor: backgroundColor ?? "var(--color-border)",
      }}
    >
      {children}
      <input
        type="range"
        min={api.min}
        max={api.max}
        step={api.step}
        value={api.value[0] ?? api.min}
        onChange={(e) => api.setValue([Number(e.target.value)])}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          opacity: 0,
          cursor: "pointer",
        }}
        aria-label="slider"
      />
    </div>
  );
};

type SliderRangeProps = { backgroundColor?: string };
const SliderRange = ({ backgroundColor }: SliderRangeProps) => {
  const api = useSliderApi();
  const v = api.value[0] ?? api.min;
  const pct = ((v - api.min) / (api.max - api.min)) * 100;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: `${pct}%`,
        borderRadius: "9999px",
        backgroundColor: backgroundColor ?? "var(--color-primary)",
      }}
    />
  );
};

type SliderThumbsProps = { borderColor?: string };
const SliderThumbs = ({ borderColor }: SliderThumbsProps) => {
  const api = useSliderApi();
  const v = api.value[0] ?? api.min;
  const pct = ((v - api.min) / (api.max - api.min)) * 100;
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: `${pct}%`,
        transform: "translate(-50%, -50%)",
        width: "20px",
        height: "20px",
        borderRadius: "9999px",
        backgroundColor: "var(--color-surface)",
        border: `2px solid ${borderColor ?? "var(--color-primary)"}`,
        pointerEvents: "none",
      }}
    />
  );
};

export const Slider = {
  RootProvider: SliderRootProvider,
  Control: SliderControl,
  Track: SliderTrack,
  Range: SliderRange,
  Thumbs: SliderThumbs,
};

// ───────────────────────────── Extra layout primitives ───────────
// Chakra v3 ships a long tail of layout helpers. We add stubs for the names
// the codebase actually imports so the app can boot. Issue #426 will replace
// each with a proper Tailwind-based primitive.

export const AspectRatio = makeBox("div", { position: "relative" });
export const SimpleGrid = makeBox("div", {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
  gap: "16px",
});
export const Float = makeBox("div", { position: "absolute" });
export const Separator = makeBox("hr", {
  border: "none",
  borderTop: "1px solid var(--color-border)",
  margin: 0,
  width: "100%",
});

// Collapsible compound — used in Splits list to expand recipient detail.
// We render content unconditionally (no folding) so the page is functional;
// Phase 2-2 (#427) introduces the real Radix Collapsible.
const CollapsibleRoot = makeBox("div");
const CollapsibleTrigger = makeBox("button", {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
});
const CollapsibleContent = makeBox("div");
export const Collapsible = Object.assign(CollapsibleRoot, {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});

// Select compound — Transaction page uses Chakra v3 Select (Root / Trigger /
// Content / Item / ValueText) plus createListCollection. Render a native
// <select> with the items so the page works; the compound subcomponents are
// no-ops that just emit their children for layout. Phase 2-2 (#427) wires
// the proper Shadcn Select.

type SelectCollection<T> = {
  items: T[];
};
export function createListCollection<T>(input: {
  items: T[];
}): SelectCollection<T> {
  return { items: input.items };
}

interface SelectRootProps extends ChakraStyleProps {
  collection?: SelectCollection<{ label: string; value: string }>;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (details: { value: string[] }) => void;
  children?: ReactNode;
}

const SelectCtx = createContext<{
  collection?: SelectCollection<{ label: string; value: string }>;
  value?: string[];
  onValueChange?: (details: { value: string[] }) => void;
}>({});

const SelectRoot = forwardRef<HTMLDivElement, SelectRootProps>(
  function SelectRoot(
    { collection, value, defaultValue, onValueChange, children, ...rest },
    ref,
  ) {
    const [internal, setInternal] = useState<string[]>(defaultValue ?? []);
    const current = value ?? internal;
    const handle = (next: string[]) => {
      if (value === undefined) setInternal(next);
      onValueChange?.({ value: next });
    };
    return (
      <SelectCtx.Provider
        value={{
          collection,
          value: current,
          onValueChange: (d) => handle(d.value),
        }}
      >
        <Box ref={ref} {...rest}>
          {/* Native select for actual interaction; render children for layout. */}
          {collection && (
            <select
              value={current[0] ?? ""}
              onChange={(e) => handle([e.target.value])}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            >
              {collection.items.map((it) => (
                <option key={it.value} value={it.value}>
                  {it.label}
                </option>
              ))}
            </select>
          )}
          {/* Children are kept around so layout pieces (Trigger / Content /
              Item) still mount, but interaction is via the native <select>. */}
          <span style={{ display: "none" }}>{children}</span>
        </Box>
      </SelectCtx.Provider>
    );
  },
);
const SelectTrigger = makeBox("div");
const SelectContent = makeBox("div");
const SelectItem = (_: AnyProps & { children?: ReactNode; item?: unknown }) =>
  null;
const SelectValueText = (_: { placeholder?: string }) => null;

export {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValueText,
};

// ───────────────────────────── Misc ───────────────────────────────

/**
 * Chakra's <Portal> renders into document.body. The shim renders inline so
 * portalled children still appear; floating positioning is lost but not
 * needed for boot. Phase 2-2 (#427) wires real Radix portals.
 */
export const Portal = ({ children }: { children?: ReactNode }) => (
  <>{children}</>
);

/**
 * <ClientOnly> in Chakra accepts a `fallback` prop and a function-as-children
 * that returns the client-rendered content. The shim invokes the children
 * directly; React Router 7's hydration handles the SSR/client split.
 */
type ClientOnlyProps = {
  fallback?: ReactNode;
  children?: ReactNode | (() => ReactNode);
};
export const ClientOnly = ({ children }: ClientOnlyProps) => {
  if (typeof children === "function") return <>{children()}</>;
  return <>{children}</>;
};

// ───────────────────────────── Avatar (legacy stub) ───────────────
// Only the namespace shape is referenced by the old wrapper at
// app/components/ui/avatar.tsx (which #420 deletes). Kept here in case
// future grep finds a stray import.

const AvatarRoot = makeBox("div", {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "9999px",
  overflow: "hidden",
});
const AvatarImage = makeBox("img");
const AvatarFallback = makeBox("span");
export const Avatar = Object.assign(AvatarRoot, {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
});

// ───────────────────────────── Re-exports for type-only imports ───
// Several files import bare types like `BoxProps`, `ButtonProps`, etc.
// Those become `any` since each shimmed component already accepts AnyProps.

export type BoxProps = ChakraStyleProps & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
};
export type ButtonProps = ComponentPropsWithoutRef<"button"> & ChakraStyleProps;
export type IconButtonProps = ComponentPropsWithoutRef<"button"> &
  ChakraStyleProps & { "aria-label"?: string; icon?: ReactNode };
export type InputProps = ComponentPropsWithoutRef<"input"> & ChakraStyleProps;
export type InputElementProps = ChakraStyleProps & {
  children?: ReactNode;
  paddingStart?: number | string;
  paddingEnd?: number | string;
};
export type TextareaProps = ComponentPropsWithoutRef<"textarea"> &
  ChakraStyleProps;
export type GroupProps = ChakraStyleProps & { children?: ReactNode };
// Chakra v3 SlotRecipeProps is generic; our shim doesn't care.
export type SlotRecipeProps<_T = unknown> = ChakraStyleProps;
export type System = unknown;
