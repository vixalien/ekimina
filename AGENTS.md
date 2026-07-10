# e-Kimina

Decentralized rotating savings platform for Rwanda. Monorepo (pnpm workspaces).

## Layout

```
app/                  Expo Router app (HeroUI Native + Uniwind)
  src/
    api/              dataClient + chain client + custody
    app/              Expo Router file-based routes
    components/       Shared UI components (ui/, loan/, members/, activity/)
    lib/              Routes, auth-storage, activity-constants
    stores/           Nanostores (auth, active-group, group, create-group)
packages/
  types/src/          @ekimina/types — shared TS types (primitives -> chain -> backend -> screen -> client)
  contracts/          @ekimina/contracts — Foundry + viem (Solidity + ABIs + deploy)
    contracts/        Ikimina.sol, MockUSDm.sol
    contracts/test/   Solidity unit tests (*.t.sol)
    script/           Forge deployment scripts
    scripts/          Deploy / read-state / extract-abis
backend/              Hono + @hono/zod-openapi + viem API server
test/                 Static HTML test page (live-server)
```

## Lifecycle

```sh
pnpm -w lint                       # Lint AND Typecheck (tsc --noEmit not necessary)
pnpm -w lint [path/to/file-or-dir] # Specific file(s)
pnpm -w fmt                        # Format
pnpm test                          # Vitest (all projects)
pnpm test --project backend        # Single project
pnpm test [path/to/file-or-dir]    # Specific file(s)
pnpm test:coverage                 # Vitest with coverage
cd packages/contracts && pnpm test # Forge Solidity tests
```

## Dev commands

All commands run from repo root (or use `pnpm --filter` / `--prefix`).

```bash
# App
cd app && pnpm expo start             # Dev server

# Backend
cd backend && pnpm dev                 # tsx watch src/index.ts (needs FACTORY_ADDRESS)

# Contracts
cd packages/contracts && pnpm compile  # Forge build + extract ABIs
cd packages/contracts && pnpm test     # Forge test
cd packages/contracts && pnpm dev      # Anvil + deploy (concurrent, state persists)
```

## Full stack dev

You can use the `dev` command which runs compile + anvil + deploy in one shot:

```bash
cd packages/contracts && pnpm dev
```

This runs `forge build`, starts `anvil` (with `--state .anvil-state` for persistence), waits for the RPC, then deploys and writes `FACTORY_ADDRESS` to `local.json`. Restart anvil later and state persists — no need to redeploy unless you delete `.anvil-state`.

For per-terminal control:

1. `cd packages/contracts && pnpm dev:node` — Anvil on `:8545` (state persists in `.anvil-state`)
2. `cd packages/contracts && pnpm dev:deploy` — deploy to localhost, prints `FACTORY_ADDRESS`
3. `FACTORY_ADDRESS=0x... cd backend && pnpm dev` — Hono API on `:3000`
4. `cd app && pnpm expo start` — Expo dev server

Backend falls back to `local.json` for FACTORY_ADDRESS if env var is unset.

## Key conventions

- **Font:** Sora (Inter weight names map to Sora families via CSS variables). Space Grotesk 700 for hero numbers, JetBrains Mono for monospace refs.
- **Text:** `AppText` for all UI text, never `Typography` (demo-only).
- **Colors:** `className` only, never `style={{ color }}`. `useThemeColor` only for native API color strings or SVG fills.
- **Icons:** `withUniwind(Ionicons)`, color via `className` (never `color` prop or `colorClassName`).
- **Layout:** `ScreenContainer` for safe area, `ScrollShadow` + `LinearGradient` for every scroll view.
- **Lists:** `ListGroup` + `PressableFeedback` (Scale + Ripple) for grouped rows.
- **Navigation:** `Routes` and `nav` helpers in `src/lib/routes.ts`. Use typed route params for pre-set filters.
- **Data fetching:** `dataClient` (from `@/api`) wraps backend calls + viem chain reads. App also supports non-custodial WalletClient for direct chain writes.
- **State:** Nanostores (`src/stores/`).

## API

- Mock OTP: `123456`
- Backend OpenAPI spec at `/openapi.json`, Scalar UI at `/scalar`
- `EXPO_PUBLIC_BACKEND_URL` env var (defaults to `http://localhost:3000`)
- `EXPO_PUBLIC_HARDHAT_RPC` env var (defaults to `http://localhost:8545`; works with anvil too)

## Shared types

Everything lives in `@ekimina/types` (re-exported from `src/api/screen-types.ts` for the app). Three layers: `primitives` (Address, BaseUnit, enums) → `chain` / `backend` / `screen` → `client` (facades).

## Dependencies

- Always use `pnpm expo install <pkg>` for native modules.
- `pnpm` with `nodeLinker: hoisted` (root `node_modules`).

---

## Testing conventions

- **Vitest** (root) with `test.projects` for each workspace package. Configs use `defineProject()` per package. Root `vitest.config.ts` orchestrates all projects.
- **Colocate tests** alongside source: `{source}.test.ts` next to `{source}.ts`. Only exception is setup utilities (`__tests__/setup.ts`).
- **Backend:** Use Hono's `app.request()` for in-process route tests (no supertest, no HTTP server). Mock blockchain layer (`contract-data.ts`) via `vi.mock()` to avoid hardhat dependency. For `null` return values, cast mock via `(mock as unknown as Mock).mockResolvedValue(null)`.
- **App stores:** Pure nanostores — test with `environment: "node"`, no React runtime needed. Reset store state in `beforeEach`.
- **Contracts (Solidity):** Forge tests in `contracts/test/*.t.sol`, run with `forge test` in `packages/contracts`.
- **Clean stores between tests:** `backend/src/__tests__/setup.ts` clears all in-memory Maps in `beforeEach`.
- **Use `body` type annotation:** `const body = (await res.json()) as ExpectedType` when the response body shape is known.
- **No `as any` in tests (lint error).** Prefer `as unknown as ExpectedType` or `as ExpectedType` casts instead.

### Fonts

Three font families, loaded via `@expo-google-fonts/*` + `useFonts` in `_layout.tsx`:

| Role                   | Font           | Weights                 | Tailwind class              |
| ---------------------- | -------------- | ----------------------- | --------------------------- |
| All UI text (default)  | Sora           | 400, 500, 600, 700, 800 | `font-normal` (via AppText) |
| Hero balance numbers   | Space Grotesk  | 700                     | `font-hero`                 |
| Transaction references | JetBrains Mono | 400                     | `font-mono`                 |

Each weight is a separate font family in React Native. The CSS variables in `global.css` map them:

```css
--font-normal: "Sora_400Regular";
--font-medium: "Sora_500Medium";
--font-semibold: "Sora_600SemiBold";
--font-bold: "Sora_700Bold";
--font-black: "Sora_800ExtraBold";
--font-mono: "JetBrainsMono_400Regular";
--font-hero: "SpaceGrotesk_700Bold";
```

Usage:

```tsx
// Default body text (Sora 400)
<AppText className="text-foreground text-base">Hello</AppText>

// Medium weight (Sora 500)
<AppText className="text-foreground text-base font-medium">Label</AppText>

// Section header (Sora 600)
<AppText className="text-foreground font-semibold">Section</AppText>

// Hero number (Space Grotesk 700)
<AppText className="text-foreground text-4xl font-hero">12,500 RWF</AppText>

// Transaction reference (JetBrains Mono 400)
<AppText className="text-muted text-xs font-mono">MM240615.0942</AppText>
```

`font-normal`, `font-medium`, `font-semibold`, `font-bold` are font-family utilities (not font-weight) that map to Sora weight variants via the CSS variables. Do not mix `font-hero` with weight classes — Space Grotesk is only loaded at 700.

### Text: use AppText, not Typography

`Typography` is for semantic headings in demos only. For all other text, use `AppText`:

```tsx
import { cn } from "heroui-native";
import { Text as RNText, type TextProps } from "react-native";

export const AppText = React.forwardRef<RNText, TextProps>((props, ref) => {
  const { className, ...rest } = props;
  return <RNText ref={ref} className={cn("font-normal", className)} {...rest} />;
});
```

```tsx
<AppText className="text-foreground text-base font-semibold">Title</AppText>
<AppText className="text-muted text-xs">Subtitle</AppText>
```

### Colors: className only, never style

Colors come from theme CSS variables via className:

- `text-foreground` — primary text
- `text-muted` — secondary text
- `text-accent` — accent-colored text (links, actions)
- `text-success` / `text-warning` / `text-danger` / `text-info` — status text
- `bg-background` — screen background
- `bg-surface-secondary` — card/input backgrounds
- `bg-accent/10` — accent with 10% opacity
- `border-border` — border color

**WRONG:** `style={{ color: useThemeColor("muted") }}`
**RIGHT:** `className="text-muted"`

`useThemeColor` is only for native APIs that need raw color strings (e.g., `headerStyle` in navigation), or for SVG stroke/fill colors in custom charts.

### Icons: withUniwind + className

```tsx
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

<StyledIonicons name="arrow-back" size={22} className="text-foreground" />
<StyledIonicons name="search" size={16} className="text-muted" />
```

`colorClassName="accent-*"` is ONLY for custom SVG icons with explicit `withUniwind` color mapping config. For vector icons (Ionicons, Feather, etc.), use `className` directly.

### Layout: ScreenContainer

Wrap every screen in `ScreenContainer` for safe area handling:

```tsx
import { ScreenContainer } from "../../components/ui/screen-container";

// Basic centered screen
<ScreenContainer className="justify-center px-6 gap-8">
  {/* content */}
</ScreenContainer>

// Screen with back button space
<ScreenContainer extraTop={12}>
  <View className="flex-1 px-6 pt-4">
    <Pressable onPress={goBack} className="absolute top-0 left-0 p-2">
      <StyledIonicons name="arrow-back" size={22} className="text-foreground" />
    </Pressable>
    {/* rest of content */}
  </View>
</ScreenContainer>
```

Back buttons are absolutely positioned at top-left, not in a flex flow.

### Prefer className over StyleSheet

Use Tailwind/Uniwind classes for styling. Only use `StyleSheet.create` for things that can't be expressed in className (animations, absolute positioning with dynamic values, platform-specific styles).

### Local images: use require()

```tsx
const splashImg = require("../../assets/splash.jpg");
```

React Native's Metro bundler uses `require()` for local images. ESM imports won't work.

### Routing: root Stack needs all screens

When the root layout uses `<Stack.Screen>` explicitly, every screen must be listed:

```tsx
<Stack>
  <Stack.Screen name="index" />
  <Stack.Screen name="welcome" />
  <Stack.Screen name="(onboarding)" />
  <Stack.Screen name="(tabs)" />
</Stack>
```

Without this, `Redirect` or `router.replace` to those routes will silently fail.

### Tab sub-screens: hide from tab bar

Sub-screens in `(tabs)/` that shouldn't appear as tabs (e.g. detail pages):

```tsx
<Tabs.Screen name="member-detail" options={{ href: null }} />
```

### TopBar: home screen only

TopBar renders only in `(tabs)/index.tsx`. The group switcher overlay lives in the tabs layout (`(tabs)/_layout.tsx`) and is triggered via `triggerSwitcher()` from `stores/active-group.ts` (sets `$openSwitcher` atom). The layout watches `$openSwitcher` via `useStore()` and opens the sheet. Always import `triggerSwitcher` from the store, do not manage sheet state in the screen.

### ListGroup + PressableFeedback

Use `ListGroup` for grouped lists (member list, settings, history, loans). Wrap tappable rows in PressableFeedback with Scale + Ripple:

```tsx
<ListGroup>
  {items.map((item, index) => (
    <Fragment key={item.id}>
      {index > 0 && <Separator className="mx-4" />}
      <PressableFeedback animation={false} onPress={handlePress}>
        <PressableFeedback.Scale>
          <ListGroup.Item>
            <ListGroup.ItemPrefix>
              <Avatar size="sm" color="accent">
                <Avatar.Fallback>{item.initials}</Avatar.Fallback>
              </Avatar>
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{item.title}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription className="text-muted">
                {item.subtitle}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </PressableFeedback.Scale>
        <PressableFeedback.Ripple />
      </PressableFeedback>
    </Fragment>
  ))}
</ListGroup>
```

`ListGroup.ItemSuffix` renders a default chevron when empty. `ItemPrefix` accepts an `Avatar` or any icon wrapper. `ItemDescription` accepts className for status colors (`text-success`, `text-warning`, `text-danger`, `text-info`).

### Search + filter pattern

Server-side search with debounce (300ms) + filter bottom sheet:

```tsx
<InputGroup>
  <InputGroup.Prefix isDecorative>
    <StyledIonicons name="search-outline" size={16} className="text-muted" />
  </InputGroup.Prefix>
  <InputGroup.Input placeholder="Search..." value={query} onChangeText={handleSearch} />
  {query && (
    <InputGroup.Suffix>
      <Pressable onPress={() => handleSearch("")} hitSlop={12}>
        <StyledIonicons name="close-circle" size={18} className="text-muted" />
      </Pressable>
    </InputGroup.Suffix>
  )}
</InputGroup>
```

Debounce via `useRef<ReturnType<typeof setTimeout> | undefined>(undefined)` + `setTimeout`/`clearTimeout`. Use a detached `BottomSheet` for filter options with `Chip` components. Show a badge dot on the filter button when a non-"all" filter is active.

### Section labels above ListGroups

Use muted uppercase labels to title grouped content:

```tsx
<View className="gap-3">
  <AppText className="text-xs text-muted uppercase tracking-wider ml-2">Section name</AppText>
  <ListGroup>{/* items */}</ListGroup>
</View>
```

### Floating button outside ScrollView

For sticky footer actions (approve, submit), place the button **outside** `ScrollView` but inside `ScreenContainer`:

```tsx
<ScreenContainer>
  <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
    <ScrollView contentContainerClassName="pb-4">{/* scrollable content */}</ScrollView>
  </ScrollShadow>
  <View className="px-4 pb-6 pt-2">
    <Button variant="primary" onPress={handleApprove}>
      <Button.Label>Approve</Button.Label>
    </Button>
  </View>
</ScreenContainer>
```

### ControlField: use Label + Description, not ControlField.Label

`ControlField` uses standalone `Label` and `Description` imports from `heroui-native`. `ControlField.Label` and `ControlField.Description` do NOT exist.

```tsx
import { ControlField, Description, Label } from "heroui-native";

// CORRECT
<ControlField isSelected={...} onSelectedChange={...}>
  <View className="flex-1">
    <Label><Label.Text>Title</Label.Text></Label>
    <Description>Description text</Description>
  </View>
  <ControlField.Indicator />
</ControlField>

// WRONG
<ControlField.Label>...</ControlField.Label>
```

For a set of toggles, use `Surface` + `Separator`:

```tsx
<Surface variant="secondary" className="py-4 px-4">
  {items.map((item, index) => (
    <View key={item.id}>
      {index > 0 && <Separator className="my-3" />}
      <ControlField isSelected={...} onSelectedChange={...}>
        <View className="flex-1">
          <Label><Label.Text>{item.title}</Label.Text></Label>
          <Description>{item.description}</Description>
        </View>
        <ControlField.Indicator />
      </ControlField>
    </View>
  ))}
</Surface>
```

### Nested Stack layout inside tabs

For tab screens that need sub-screens (e.g. profile > group-settings, committee), use a directory-based layout:

```
(tabs)/profile/
  _layout.tsx     # Stack layout with slide_from_right animation
  index.tsx       # Tab screen (profile home)
  group-settings.tsx  # Sub-screen
  committee.tsx       # Sub-screen
```

### ScrollShadow on every scrollable screen

Every `ScrollView` must be wrapped in `ScrollShadow` with LinearGradient:

```tsx
import { LinearGradient } from "expo-linear-gradient";
import { ScrollShadow } from "heroui-native";

<ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
  <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-36">
    {/* content */}
  </ScrollView>
</ScrollShadow>;
```

### BottomSheet trigger: use Pressable, not View

`BottomSheet.Trigger asChild` with a bare `View` does not receive press events. Always use `Pressable` with `hitSlop`:

```tsx
<BottomSheet.Trigger asChild>
  <Pressable hitSlop={8} onPress={() => setIsOpen(true)}>
    <StyledIonicons name="information-circle-outline" size={18} className="text-muted" />
  </Pressable>
</BottomSheet.Trigger>
```

### Route param initialization for pre-set filters

When navigating to a screen with pre-set filter values, pass them as route params. The target screen reads them with `useLocalSearchParams`:

```tsx
// Navigation helper
toLoanRepayments: (memberId: string) =>
  router.push({
    pathname: Routes.activity.transactions,
    params: { type: "loan_repayment", memberId },
  });

// Target screen
const params = useLocalSearchParams<{ type?: string; memberId?: string }>();
const [typeFilter, setTypeFilter] = useState<TypeFilterValue>(
  (params.type as TypeFilterValue) ?? "all",
);
const [memberFilter, setMemberFilter] = useState<string[]>(
  params.memberId ? [params.memberId] : [],
);
```

### Committee-only actions (member detail)

`getMemberDetail` response includes `isCommitteeMember` (boolean). Use it to conditionally show destructive actions:

```tsx
{
  detail.isCommitteeMember && (
    <Button variant="danger">
      <Button.Label>Withdraw member</Button.Label>
    </Button>
  );
}
```

### Phone input: InputGroup + Select

```tsx
<TextField isRequired>
  <Label>Phone number</Label>
  <InputGroup>
    <InputGroup.Prefix className="flex-row">
      <Select presentation="bottom-sheet" value={countryCode} onValueChange={...}>
        <Select.Trigger variant="unstyled" className="flex-row items-center gap-1">
          <AppText>{flag}</AppText>
          <AppText className="text-sm font-medium text-foreground">{code}</AppText>
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content presentation="bottom-sheet">
            <Select.ListLabel>Select country</Select.ListLabel>
            {options.map((opt) => (
              <Select.Item key={opt.value} value={opt.value} label={opt.label}>
                <AppText>{opt.flag}</AppText>
                <AppText className="text-sm text-muted w-10">{opt.code}</AppText>
                <AppText className="flex-1 text-base text-foreground">{opt.label}</AppText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Portal>
      </Select>
      <Separator orientation="vertical" className="h-5" />
    </InputGroup.Prefix>
    <InputGroup.Input placeholder="7XX XXX XXX" keyboardType="phone-pad" />
  </InputGroup>
  <Description>Helper text</Description>
</TextField>
```

### InputGroup with decorative icon prefix

```tsx
<InputGroup>
  <InputGroup.Prefix isDecorative>
    <StyledIonicons name="search-outline" size={16} className="text-muted" />
  </InputGroup.Prefix>
  <InputGroup.Input placeholder="Search..." />
</InputGroup>
```

### DRY: extract reusable ListGroup patterns

Never duplicate ListGroup layouts across screens. If two screens show the same data card (e.g., loan terms, borrower info, repayment progress), extract it into a shared component in `components/`. Examples:

- `components/loan/borrower-info.tsx` — tappable avatar + name + role
- `components/loan/loan-terms-card.tsx` — amount, interest, total, deadline, purpose
- `components/loan/repayment-info.tsx` — amount paid, total, percentage, optional press handler

### Less is more

- Don't add unnecessary className props
- Don't wrap things in extra Views unless needed
- Use `gap-*` for spacing between siblings, not `mt-*`/`mb-*` on every child
- Trust component defaults (Button is full-width by default)
- Use built-in subcomponents instead of custom ones (e.g. `BottomSheet.Close` instead of a custom `Pressable` with an X icon)

## Status colors per contribution

- `"paid_on_time"` — `text-success`
- `"paid_late"` — `text-warning` (with penalty amount)
- `"missed"` — `text-danger`

Reputation gauge color bands:

- Score > 70: success color
- Score 40-70: warning color
- Score < 40: danger color
