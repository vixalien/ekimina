# e-Kimina Capstone Project

**Skill:** `heroui-native` skill (fetch component docs before implementing)

## Project layout

```
app/                Expo Router React Native app (HeroUI Native + Uniwind)
  src/
    api/            API client (auth, groups) with mock data
    app/            Expo Router file-based routes
    components/     Reusable components (ui/, group-switcher, members/)
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

### Fonts

Three font families, loaded via `@expo-google-fonts/*` + `useFonts` in `_layout.tsx`:

| Role | Font | Weights | Tailwind class |
|------|------|---------|----------------|
| All UI text (default) | Inter | 400, 500, 600, 700 | `font-normal` (via AppText) |
| Hero balance numbers | Space Grotesk | 700 | `font-hero` |
| Transaction references | JetBrains Mono | 400 | `font-mono` |

Each weight is a separate font family in React Native. The CSS variables in `global.css` map them:

```css
/* @theme -- font-family variables (override Tailwind's font-weight defaults) */
--font-normal: "Inter_400Regular";
--font-medium: "Inter_500Medium";
--font-semibold: "Inter_600SemiBold";
--font-bold: "Inter_700Bold";
--font-black: "Inter_900Black";
--font-mono: "JetBrainsMono_400Regular";
--font-hero: "SpaceGrotesk_700Bold";
```

Usage:
```tsx
// Default body text (Inter 400)
<AppText className="text-foreground text-base">Hello</AppText>

// Medium weight (Inter 500)
<AppText className="text-foreground text-base font-medium">Label</AppText>

// Section header (Inter 600)
<AppText className="text-foreground font-semibold">Section</AppText>

// Hero number (Space Grotesk 700)
<AppText className="text-foreground text-4xl font-hero">12,500 RWF</AppText>

// Transaction reference (JetBrains Mono 400)
<AppText className="text-muted text-xs font-mono">MM240615.0942</AppText>
```

`font-normal`, `font-medium`, `font-semibold`, `font-bold` are font-family utilities (not font-weight) that map to Inter weight variants via the CSS variables. Do not mix `font-hero` with weight classes -- Space Grotesk is only loaded at 700.

### Text: use AppText, not Typography

`Typography` is for semantic headings in demos only. For all other text, use `AppText`:

```tsx
// components/ui/app-text.tsx
import { cn } from "heroui-native";
import { Text as RNText, type TextProps } from "react-native";

export const AppText = React.forwardRef<RNText, TextProps>((props, ref) => {
  const { className, ...rest } = props;
  return <RNText ref={ref} className={cn("font-sans font-normal", className)} {...rest} />;
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
- `text-success` / `text-warning` / `text-danger` / `text-info` -- status text
- `bg-background` -- screen background
- `bg-surface-secondary` -- card/input backgrounds
- `bg-accent/10` -- accent with 10% opacity
- `border-border` -- border color

**WRONG:** `style={{ color: useThemeColor("muted") }}`
**RIGHT:** `className="text-muted"`

`useThemeColor` is only for native APIs that need raw color strings (e.g., `headerStyle` in navigation), or for SVG stroke/fill colors in custom charts.

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
- `variant="danger"` -- destructive action (red background)
- `variant="danger-soft"` -- soft destructive actions

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
<Tabs.Screen
  name="member-detail"
  options={{ href: null }}
/>
```

### TopBar: home screen only

TopBar renders only in `(tabs)/index.tsx`. The group switcher overlay lives in the tabs
layout (`(tabs)/_layout.tsx`) and is triggered via `triggerSwitcher()` from
`stores/active-group.ts` (sets `$openSwitcher` atom). The layout watches `$openSwitcher`
via `useStore()` and opens the sheet. Always import `triggerSwitcher` from the store,
do not manage sheet state in the screen.

### List screens: ListGroup + PressableFeedback

Use `ListGroup` for any grouped list (member list, settings, history, loans).
Wrap tappable rows in PressableFeedback with Scale + Ripple:

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

`ListGroup.ItemSuffix` renders a default chevron when empty. `ListGroup.ItemPrefix`
accepts an `Avatar` or any icon wrapper. `ItemDescription` accepts className for status
colors (`text-success`, `text-warning`, `text-danger`, `text-info`).

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

Debounce via `useRef<ReturnType<typeof setTimeout> | undefined>(undefined)` + `setTimeout`/`clearTimeout`.
Call `api.groups.searchMembers(groupId, query)` on debounce. Use a detached `BottomSheet` for
filter options with `Chip` components. Show a badge dot on the filter button when a non-"all"
filter is active.

### Committee-only actions (member detail)

`getMemberDetail` response includes `isCommitteeMember` (boolean). Use it to
conditionally show destructive actions like "Withdraw member":

```tsx
{detail.isCommitteeMember && (
  <Button variant="danger">
    <Button.Label>Withdraw member</Button.Label>
  </Button>
)}
```

### HeroUI Native Component Patterns

**Reference repo:** `/home/alien/sites/alu/heroui-native-example/`
**Docs:** `node scripts/get_component_docs.mjs <Component>` in the skill directory

Always check the reference project & docs before implementing ANY HeroUI component. Do not guess APIs or invent patterns.

| Component | When to use | Notes |
|---|---|---|
| `Surface` | Grouped content containers, stat cards, list rows | `variant="secondary"` for card bg |
| `Card` | Tappable card surfaces | Wrap in `PressableFeedback`, never `onPress` directly |
| `Avatar` | User/group avatars with initials | `size="sm"`/`"md"`/`"lg"`, `color="accent"` for custom bg |
| `BottomSheet` | Modal sheets from bottom | Uses `Portal`/`Overlay`/`Content` pattern |
| `RadioGroup` | List selection (group switcher, filters) | Use custom `Radio.Indicator` for icons |
| `Button` | All action buttons | Compound with `Button.Label`, never raw `Pressable` |
| `PressableFeedback` | Custom pressable surfaces (cards, rows) | Adds scale/highlight animation |
| `Chip` | Labels, badges, status pills, filter options | `variant="primary"`/`"soft"`, `color="accent"`/`"danger"`/etc |
| `Separator` | Visual dividers | `orientation="vertical"` for inline |
| `ListGroup` | Grouped list displays (settings, members, history) | Compound with `Item`/`ItemPrefix`/`ItemContent`/`ItemTitle`/`ItemDescription`/`ItemSuffix` |
| `InputGroup` | Search bars, decorated inputs | Compound with `Prefix`/`Input`/`Suffix`; `isDecorative` on prefix |
| `AppText` | All UI text | Not `Typography` (demos only) |

### Less is more

- Don't add unnecessary className props
- Don't wrap things in extra Views unless needed
- Use `gap-*` for spacing between siblings, not `mt-*`/`mb-*` on every child
- Trust component defaults (Button is full-width by default, etc.)
- Use built-in subcomponents instead of custom ones (e.g. `BottomSheet.Close` instead of a custom `Pressable` with an X icon)

### Always check the reference project & docs

Before implementing any HeroUI Native component, check:
1. The reference example at `/home/alien/sites/alu/heroui-native-example/`
2. Component docs via `node scripts/get_component_docs.mjs <Component>` in the skill directory
3. Use the patterns you find — don't guess APIs

**Default to reference patterns.** Copy the structure, imports, and prop patterns from the reference project. Don't reinvent the wheel — if the reference uses `RadioGroup` + `Surface` + `Separator` for a list, use the same. If it uses `ScrollShadow` + `ScrollView` for scrollable content, use the same. Only deviate when there's a clear reason.

### ScrollShadow on every scrollable screen

Every `ScrollView` must be wrapped in `ScrollShadow` with the LinearGradient component:

```tsx
import { LinearGradient } from "expo-linear-gradient";
import { ScrollShadow } from "heroui-native";

<ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
  <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-36">
    {/* content */}
  </ScrollView>
</ScrollShadow>
```

### Section labels above ListGroups

Use muted uppercase labels to title grouped content. This pattern appears on activity, loan detail, and review screens:

```tsx
<View className="gap-3">
  <AppText className="text-xs text-muted uppercase tracking-wider ml-2">Section name</AppText>
  <ListGroup>
    {/* items */}
  </ListGroup>
</View>
```

### BottomSheet trigger: use Pressable, not View

`BottomSheet.Trigger asChild` with a bare `View` does not receive press events. Always use `Pressable` with `hitSlop`:

```tsx
<BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
  <BottomSheet.Trigger asChild>
    <Pressable hitSlop={8} onPress={() => setIsOpen(true)}>
      <StyledIonicons name="information-circle-outline" size={18} className="text-muted" />
    </Pressable>
  </BottomSheet.Trigger>
  {/* ... */}
</BottomSheet>
```

### Route param initialization for pre-set filters

When navigating to a screen with pre-set filter values, pass them as route params. The target screen reads them with `useLocalSearchParams` to initialize state:

```tsx
// Navigation helper
toLoanRepayments: (memberId: string) =>
  router.push({
    pathname: Routes.activity.transactions,
    params: { type: "loan_repayment", memberId },
  })

// Target screen reads params
const params = useLocalSearchParams<{ type?: string; memberId?: string }>();
const [typeFilter, setTypeFilter] = useState<TypeFilterValue>(
  (params.type as TypeFilterValue) ?? "all"
);
const [memberFilter, setMemberFilter] = useState<string[]>(
  params.memberId ? [params.memberId] : []
);
```

### DRY: extract reusable ListGroup patterns

Never duplicate ListGroup layouts across screens. If two screens show the same data card (e.g., loan terms, borrower info, repayment progress), extract it into a shared component in `components/`. Examples:
- `components/loan/borrower-info.tsx` -- tappable avatar + name + role, navigates to member page
- `components/loan/loan-terms-card.tsx` -- amount, interest, total, deadline, purpose
- `components/loan/repayment-info.tsx` -- amount paid, total, percentage, optional press handler

---

## API Client Structure

```
src/api/
  types.ts           # AuthApi, GroupsApi, ApiClient interfaces + data types
  auth.ts            # createMockAuth() - sendOtp, resendOtp, verifyOtp
  groups.ts          # createMockGroups() - myGroups, joinByInviteCode, searchMembers, etc
  mock/
    users.ts         # MOCK_OTP, MOCK_USERS
    groups.ts        # ALL_GROUPS, MOCK_MEMBERSHIPS, INVITE_CODE_MAP, MOCK_GROUP_DATA, computeDashboard()
  index.ts           # exports api = { auth, groups }
```

Usage: `import { api } from "../../api"` then `api.auth.sendOtp()`, `api.groups.searchPublicGroups()`

Mock OTP: `123456`
Pre-seeded users: `+250788123456` (1 group), `+250788654321` (2 groups), `+250788999888` (no groups)

### GroupsApi methods

| Method | Returns | Description |
|---|---|---|
| `myGroups(userId)` | `GroupMembership[]` | User's group memberships |
| `joinByInviteCode(userId, code)` | `JoinRequest` | Join by invite code |
| `searchPublicGroups(query)` | `PublicGroup[]` | Browse public groups |
| `getGroupDetails(groupId)` | `PublicGroup` | Single group info |
| `requestToJoinGroup(userId, groupId)` | `JoinRequest` | Request to join |
| `getJoinRequestStatus(requestId)` | `JoinRequest` | Poll pending request |
| `cancelJoinRequest(requestId)` | `{ success }` | Cancel pending request |
| `createGroup(payload)` | `CreateGroupResult` | Create new group |
| `getGroupDashboard(groupId)` | `GroupDashboardData` | Home dashboard data |
| `getGroupMembers(groupId)` | `MemberListItem[]` | Full member roster for current cycle |
| `searchMembers(groupId, query)` | `MemberListItem[]` | Filter members by name (server-side) |
| `getMemberDetail(groupId, userId, requestingUserId)` | `MemberDetail` | Full member profile |
| `getPendingRequests(groupId)` | `ActivityPendingRequest[]` | Committee pending actions |
| `getOutstandingLoans(groupId)` | `OutstandingLoan[]` | Active loans with borrower info |
| `getRecentTransactions(groupId, limit?)` | `Transaction[]` | Recent transactions, default limit 5 |
| `getTransactions(groupId, filters?)` | `Transaction[]` | Full filtered transaction list |
| `getTransactionDetail(groupId, transactionId)` | `TransactionDetail` | Type-specific transaction detail |
| `retryTransaction(transactionId)` | `{ success }` | Retry failed transaction |
| `getLoanDetail(groupId, loanId)` | `LoanDetail` | Loan lifecycle detail (7 states) |
| `getLoanRequestReview(groupId, loanId)` | `LoanRequestReview` | Committee review data |
| `signLoanRequest(groupId, loanId, userId)` | `{ success, thresholdMet }` | Sign loan request |
| `rejectLoanRequest(groupId, loanId, userId)` | `{ success }` | Reject loan request |

### Key data types

| Type | Fields | Used by |
|---|---|---|
| `MemberStanding` | `userId, initials, name, status` | Dashboard member avatars |
| `MemberListItem` | `userId, initials, name, status, reputation, activeLoanAmount, penaltyCount` | Members list |
| `MemberDetail` | `userId, name, initials, role, joinedCycle, reputation, onTimeContributions, totalContributions, activeLoanCount, penaltyCount, contributionHistory[], loans[], isCommitteeMember` | Member detail screen |
| `ContributionHistoryEntry` | `cycle, status ("paid_on_time"\|"paid_late"\|"missed"), penaltyAmount?` | Contribution history section |
| `LoanEntry` | `id, amount, state` | Loans section |
| `ActivityPendingRequest` | `id, type, subject, amountOrValue?, signatureCount, signatureThreshold, timestamp` | Activity pending actions |
| `OutstandingLoan` | `loanId, borrowerName, borrowerInitials, borrowerUserId, amount, dueCycle` | Activity outstanding loans |
| `Transaction` | `id, type, memberName, memberInitials, memberId, amount, direction, status, cycle, timestamp` | Transaction list |
| `TransactionDetail` | Discriminated union per type: `ContributionDetail`, `PayoutDetail`, `PenaltyDetail`, `LoanRepaymentDetail`, `LoanDisbursementDetail`, `DiscretionaryDetail` | Transaction detail screen |
| `LoanState` | `"requested"\|"signing"\|"approved"\|"disbursed"\|"repaying"\|"repaid"\|"defaulted"` | Loan lifecycle |
| `LoanDetail` | Discriminated union per state: `RequestedLoanDetail`, `SigningLoanDetail`, `ApprovedLoanDetail`, `DisbursedLoanDetail`, `RepayingLoanDetail`, `RepaidLoanDetail`, `DefaultedLoanDetail` | Loan detail screen |
| `LoanRequestReview` | `loanId, borrowerName, borrowerInitials, borrowerUserId, borrowerRole, borrowerJoinedCycle, borrowerReputation, borrowerActiveLoanCount, amount, interestRate, purpose, deadline, signatureThreshold, collectedSignatures, signatures[], currentUserAlreadySigned, currentUserSignedAt?` | Loan review screen |
| `LoanSignature` | `userId, name, initials, role, signed, signedAt?` | Signature lists |

Status colors per contribution:
- `"paid_on_time"` -- `text-success`
- `"paid_late"` -- `text-warning` (with penalty amount)
- `"missed"` -- `text-danger`

Reputation gauge color bands:
- Score > 70: success color
- Score 40-70: warning color
- Score < 40: danger color
