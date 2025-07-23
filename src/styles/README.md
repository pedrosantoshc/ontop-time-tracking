# Ontop Design System

This directory contains the comprehensive design system for the Ontop Time Tracking application. The design system provides a consistent foundation for building professional, accessible, and maintainable user interfaces.

## 📁 File Structure

```
src/styles/
├── design-tokens.scss    # Core design tokens and CSS variables
├── layout.scss          # Layout system with Grid and Flexbox utilities
├── typography.scss      # Typography scale and text utilities
├── utilities.scss       # Utility classes for common patterns
└── README.md           # This documentation file
```

## 🎨 Design Tokens

The `design-tokens.scss` file contains all foundational design values:

### Spacing Scale
Based on a 4px grid system for consistent spacing:
- `--spacing-xs` (4px) through `--spacing-6xl` (96px)
- Use via utility classes: `.m-lg`, `.p-xl`, etc.

### Typography
Systematic typography with proper hierarchy:
- Font families: Roboto (primary), Roboto Mono (code)
- Font sizes: `--font-size-xs` (12px) through `--font-size-6xl` (60px)
- Font weights: light (300) through bold (700)
- Line heights: tight (1.25) through loose (2.0)

### Color Palette
Extended color system based on official Ontop brand:
- **Primary:** Ontop Pink (#ff5a70 - Wild Watermelon)
- **Secondary:** Ontop Dark (#222222 - Mine Shaft)  
- **Semantic:** Success, Warning, Error, Info (full 50-900 scales)
- **Neutral:** Comprehensive grayscale (50-900)

### Elevation System
8-level shadow system for consistent depth:
- `--elevation-0` (none) through `--elevation-7` (maximum depth)
- Special shadows: inner, outline, focus

### Border Radius
Consistent radius scale:
- `--radius-sm` (2px) through `--radius-3xl` (24px)
- Special: `--radius-full` (9999px) for circular elements

### Transitions
Standardized timing and easing:
- Durations: 75ms through 1000ms
- Easing functions: linear, ease-in, ease-out, ease-in-out, bounce
- Common transitions: colors, opacity, transform, all

## 🏗️ Layout System

The `layout.scss` file provides a comprehensive layout system:

### Container System
Responsive containers with max-widths:
```scss
.container--sm    // 640px max-width
.container--md    // 768px max-width  
.container--lg    // 1024px max-width
.container--xl    // 1280px max-width
.container--2xl   // 1536px max-width
.container--fluid // No max-width
```

### CSS Grid System
Flexible grid layouts:
```scss
.grid--cols-3           // 3 equal columns
.grid--md-cols-2        // 2 columns on medium screens
.grid--auto-fit-md      // Auto-fit with 300px minimum
.grid--gap-lg           // Large gap between items
```

### Flexbox System
Comprehensive flex utilities:
```scss
.flex--row              // Horizontal direction
.flex--col              // Vertical direction
.flex--justify-between  // Space between items
.flex--items-center     // Center align items
.flex--gap-md           // Medium gap
```

### Spacing Utilities
Margin and padding classes:
```scss
.m-lg      // Large margin all sides
.mt-xl     // Extra large margin top
.p-md      // Medium padding all sides
.pb-sm     // Small padding bottom
```

### Layout Components
Pre-built layout patterns:
```scss
.layout              // Full-height flex layout
.layout-sidebar      // Sidebar + content layout
.stack--lg           // Vertical spacing stack
.inline--md          // Horizontal spacing inline
.center              // Center alignment utility
```

## ✍️ Typography

The `typography.scss` file provides systematic text styling:

### Heading Styles
Semantic heading classes:
```scss
.text-h1, h1    // 48px/60px, bold, tight line-height
.text-h2, h2    // 36px, bold, tight line-height
.text-h3, h3    // 30px, semibold, snug line-height
.text-h4, h4    // 24px, semibold, snug line-height
.text-h5, h5    // 20px, medium, snug line-height
.text-h6, h6    // 18px, medium, normal line-height
```

### Body Text Styles
Content text classes:
```scss
.text-body-lg    // 18px, relaxed line-height
.text-body       // 16px, normal line-height (default)
.text-body-sm    // 14px, secondary color
.text-caption    // 12px, tertiary color
.text-overline   // 12px, bold, uppercase, spaced
```

### Utility Classes
Text modification utilities:
```scss
// Sizes
.text-xs through .text-6xl

// Weights  
.font-light, .font-normal, .font-medium, .font-semibold, .font-bold

// Colors
.text-primary, .text-secondary, .text-tertiary
.text-brand-primary, .text-success, .text-warning, .text-error

// Alignment
.text-left, .text-center, .text-right, .text-justify

// Decoration
.underline, .no-underline, .line-through

// Transform
.uppercase, .lowercase, .capitalize, .normal-case
```

### Reading Experience
Optimized prose styling:
```scss
.prose    // Optimized reading layout with proper spacing
```

## 🛠️ Utilities

The `utilities.scss` file contains hundreds of utility classes:

### Display & Visibility
```scss
.block, .inline-block, .flex, .grid, .hidden
.visible, .invisible
```

### Sizing
```scss
.w-full, .w-1/2, .w-auto, .w-fit
.h-screen, .h-full, .h-auto
.min-w-0, .max-w-lg, .min-h-screen
```

### Background & Borders
```scss
.bg-primary, .bg-white, .bg-gray-100
.border, .border-2, .border-primary
.rounded, .rounded-lg, .rounded-full
```

### Shadows & Effects
```scss
.shadow-sm, .shadow-lg, .shadow-xl
.opacity-50, .opacity-75
```

### Positioning & Layout
```scss
.relative, .absolute, .fixed, .sticky
.z-10, .z-modal, .z-tooltip
```

### Transitions & Animations
```scss
.transition-all, .transition-colors
.duration-300, .ease-in-out
.animate-spin, .animate-fade-in, .animate-bounce
```

### Interactive States
```scss
.cursor-pointer, .cursor-not-allowed
.select-none, .pointer-events-none
```

## 🎯 Usage Guidelines

### Import Order
Always import design tokens first:
```scss
@import './design-tokens.scss';
@import './layout.scss';
@import './typography.scss';
@import './utilities.scss';
```

### Naming Conventions
- Use semantic names over descriptive names
- Follow BEM methodology for component-specific styles
- Prefer utility classes for spacing and layout
- Use CSS custom properties for dynamic values

### Responsive Design
- Mobile-first approach with progressive enhancement
- Use container queries where supported
- Leverage the responsive utility variants

### Accessibility
- All colors meet WCAG 2.1 AA contrast requirements
- Focus states are clearly visible
- Screen reader utilities (`.sr-only`) are available
- Semantic HTML should be used with utility classes

### Performance
- Utilities are atomic and reusable
- CSS custom properties enable efficient theming
- Critical styles should be inlined
- Non-critical animations respect `prefers-reduced-motion`

## 🔧 Customization

### Adding New Tokens
1. Add the token to `design-tokens.scss`
2. Create corresponding utility classes if needed
3. Update this documentation
4. Test across all components

### Creating Components
1. Use existing design tokens
2. Follow the established patterns
3. Add utility class variants where appropriate
4. Ensure responsive behavior
5. Test accessibility compliance

### Extending Colors
When adding new colors:
1. Follow the 50-900 scale pattern
2. Ensure adequate contrast ratios
3. Add corresponding utility classes
4. Update semantic color mappings

## 📱 Responsive Breakpoints

```scss
--breakpoint-xs: 0px      // Mobile first
--breakpoint-sm: 576px    // Small devices
--breakpoint-md: 768px    // Tablets
--breakpoint-lg: 1024px   // Desktop
--breakpoint-xl: 1280px   // Large desktop
--breakpoint-2xl: 1536px  // Extra large
```

## 🎨 Component Integration

### With Angular Material
This design system works alongside Angular Material:
- Material components use our custom theme
- Utility classes enhance Material components
- Design tokens ensure consistency

### Best Practices
1. **Composition over customization:** Use utility classes to compose layouts
2. **Consistency:** Stick to the design tokens and scales
3. **Performance:** Leverage the efficient utility-first approach
4. **Maintainability:** Follow the established patterns and conventions

## 🐛 Troubleshooting

### Common Issues
1. **Styles not applying:** Check import order and specificity
2. **Responsive not working:** Verify breakpoint syntax
3. **Colors not matching:** Ensure using design tokens
4. **Typography inconsistent:** Use semantic text classes

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox support required
- CSS custom properties support required
- Falls back gracefully for older browsers

This design system provides a solid foundation for building beautiful, consistent, and maintainable user interfaces in the Ontop Time Tracking application.