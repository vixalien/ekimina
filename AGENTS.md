# e-Kimina Capstone Project

## Project layout

```
app/                Expo Router React Native app (HeroUI Native + Uniwind)
  src/
    api/            API client (auth, groups) with mock data
    app/            Expo Router file-based routes
    components/     Reusable components (ui/, group-switcher)
    lib/            Utilities (nav helper)
contract/           Hardhat + viem Solidity contracts
backend/            (placeholder)
docs/               Documentation
```

## Working in the app

### Running

```bash
cd app
pnpm expo start        # Start Expo dev server
npm run typecheck      # TypeScript check
npm run lint           # ESLint
npm run format:check   # Prettier check
```

### Installing dependencies

Always use `pnpm expo install <package>` for native modules (not `npm i`).

---

## HeroUI Native Patterns

**Reference repo:** `/home/alien/sites/alu/heroui-native-example/`
**Docs:** https://heroui.com/native/llms-full.txt
**Skill:** `heroui-native` skill (fetch component docs before implementing)

### Critical setup (global.css)

```css
@import "tailwindcss";
@import "uniwind";
@import "heroui-native/styles";
@import "heroui-native/styles/vibrant";   /* REQUIRED for component variants */
@source '../node_modules/heroui-native/lib';
```

The `vibrant` import is required for component variants (primary button backgrounds, etc.) to render correctly.

### Text: use AppText, not Typography

`Typography` is for semantic headings in demos only. For all other text, use `AppText`:

```tsx
// components/ui/app-text.tsx
import { cn } from "heroui-native";
import { Text as RNText, type TextProps } from "react-native";

export const AppText = React.forwardRef<RNText, TextProps>((props, ref) => {
  const { className, ...rest } = props;
  return <RNText ref={ref} className={cn("font-normal", className)} {...rest} />;
});
```

Usage:
```tsx
<AppText className="text-foreground text-base font-semibold">Title</AppText>
<AppText className="text-muted text-xs">Subtitle</AppText>
```

### Colors: className only, never style={{ color: ... }}

Colors come from theme CSS variables and are applied via className:

- `text-foreground` -- primary text
- `text-muted` -- secondary text
- `text-accent` -- accent-colored text (links, actions)
- `bg-background` -- screen background
- `bg-surface-secondary` -- card/input backgrounds
- `bg-accent/10` -- accent with 10% opacity
- `border-border` -- border color

**WRONG:** `style={{ color: useThemeColor("muted") }}`
**RIGHT:** `className="text-muted"`

`useThemeColor` is only for native APIs that need raw color strings (e.g., `headerStyle` in navigation).

### Icons: withUniwind + className

```tsx
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

// Usage - className for colors, NOT color prop or colorClassName
<StyledIonicons name="arrow-back" size={22} className="text-foreground" />
<StyledIonicons name="search" size={16} className="text-muted" />
```

`colorClassName="accent-*"` is ONLY for custom SVG icons with explicit `withUniwind` color mapping config. For vector icons (Ionicons, Feather, etc.), use `className` directly.

### Layout: ScreenContainer component

Wrap every screen in `ScreenContainer` for safe area handling:

```tsx
import { ScreenContainer } from "../../components/ui";

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

### Button variants

Primary buttons have backgrounds by default. No extra `bg-` class needed.

- `variant="primary"` -- accent background, accent-foreground text
- `variant="secondary"` -- surface background
- `variant="ghost"` -- transparent, for inline actions
- `variant="danger-soft"` -- soft destructive actions

### Less is more

- Don't add unnecessary className props
- Don't wrap things in extra Views unless needed
- Use `gap-*` for spacing between siblings, not `mt-*`/`mb-*` on every child
- Trust component defaults (Button is full-width by default, etc.)

---

## API Client Structure

```
src/api/
  types.ts           # AuthApi, GroupsApi, ApiClient interfaces
  auth.ts            # createMockAuth() - sendOtp, resendOtp, verifyOtp
  groups.ts          # createMockGroups() - myGroups, joinByInviteCode, etc
  mock/
    users.ts         # MOCK_OTP, MOCK_USERS
    groups.ts        # ALL_GROUPS, MOCK_MEMBERSHIPS, INVITE_CODE_MAP, toPublicGroup()
  index.ts           # exports api = { auth, groups }
```

Usage: `import { api } from "../../api"` then `api.auth.sendOtp()`, `api.groups.searchPublicGroups()`

Mock OTP: `123456`
Pre-seeded users: `+250788123456` (1 group), `+250788654321` (2 groups), `+250788999888` (no groups)
