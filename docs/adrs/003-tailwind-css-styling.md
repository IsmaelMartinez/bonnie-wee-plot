# ADR 003: Tailwind CSS for Styling

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

The application needed a styling approach that:
- Enables rapid UI development
- Maintains consistency across pages
- Supports responsive design
- Works well with React components
- Doesn't require complex build configurations

## Decision

Use **Tailwind CSS** as the primary styling solution with a custom color palette.

### Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          // ... green color palette
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
      },
    },
  },
}
```

### Design Patterns Established

1. **Gradient Backgrounds**
```tsx
<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
```

2. **Card Components**
```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
```

3. **Primary Buttons**
```tsx
<button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
```

4. **Form Inputs**
```tsx
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
```

5. **Section Headers**
```tsx
<div className="flex items-center mb-4">
  <Icon className="w-6 h-6 text-green-600 mr-2" />
  <h2 className="text-xl font-bold text-gray-800">Title</h2>
</div>
```

### Light Theme Only

```css
/* src/app/globals.css */
/* Note: Dark mode is not currently supported.
 * The app is designed with a light theme only. */
```

## Consequences

### Positive
- **Rapid development** - Utility classes speed up styling
- **Consistency** - Predefined scales for spacing, colors, typography
- **No CSS conflicts** - Scoped to component level
- **Small bundle** - PurgeCSS removes unused styles
- **Responsive** - Built-in responsive modifiers (`md:`, `lg:`)
- **IDE support** - IntelliSense for class names

### Negative
- **Verbose JSX** - Long className strings
- **Learning curve** - Need to learn Tailwind's utility naming
- **No component library** - Built everything from scratch
- **Customization overhead** - Need to extend theme for project colors

### Design System Notes
- Green primary color reflects gardening/nature theme
- Cards with shadows create depth hierarchy
- Consistent spacing using Tailwind's scale (4, 6, 8, etc.)
- Lucide icons used throughout for consistent iconography




