# Cross-Platform UI Primitives

Reusable components that mirror the **web design system** (apps/customer) so Expo UI matches the web while staying React Native–compatible.

## Design tokens

- **Theme**: `theme/colors.ts` (and `theme/index.ts`) – colors, spacing, typography, borderRadius, shadows.
- Tokens align with web `--albaz-*` (cream, olive, orange, surface, card radius 18, input radius 16).

## Components

| Component | Purpose | Web analogue |
|-----------|---------|--------------|
| **Box** | Layout with Flexbox + token-based padding/margin/gap | `div` with flex + Tailwind spacing |
| **Text** | Typography with variants (h1, h2, body, caption, label, button) | `span`/`p` with text styles |
| **Button** | primary, secondary, outline, ghost, destructive | `Button` (CVA variants) |
| **Card** | Surface, radius 18, shadow, optional padding | `.albaz-card` |
| **Input** | Text input with border, radius 16, optional left icon | `Input` + `.albaz-search` |
| **Stack** | Vertical/horizontal stack with gap and alignment | flex container with gap |

## Layout parity (Flexbox)

- Use **Box** for containers: `flexDirection="row"`, `alignItems`, `justifyContent`, `gap` (via Stack or Box gap).
- Use **Stack** for one-dimensional layout with consistent `gap` (spacing token).
- Same spacing scale as web: `xs`(4) → `xxl`(48).

## Responsive behavior

- Screens use `flex: 1` and `ScrollView`/`FlatList` so content scrolls on small viewports.
- Horizontal lists (e.g. categories) use `ScrollView` with `contentContainerStyle` and `gap`.
- No media queries; layout is flex-based and adapts to available width/height.

## Usage

```tsx
import { Box, Text, Button, Card, Input, Stack } from '../components/ui';
import { colors, spacing } from '../theme';

<Box flex={1} backgroundColor={colors.background} px="md" py="lg">
  <Stack direction="vertical" gap="md">
    <Text variant="h2">Title</Text>
    <Input placeholder="Search..." value={q} onChangeText={setQ} />
    <Button variant="primary" onPress={submit}>Submit</Button>
  </Stack>
</Box>
```
