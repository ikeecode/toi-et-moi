# Design System: Celestial Intimacy

## 1. Overview & Creative North Star
**Creative North Star: "The Ethereal Observatory"**

This design system is built to evoke the feeling of a shared midnight sky—vast, quiet, and deeply private. We are moving away from the "utility-first" look of standard apps toward a **High-End Editorial** experience. The interface should feel less like a tool and more like a digital keepsake.

To achieve this, we employ **Intentional Asymmetry**. Do not feel tethered to a rigid, centered grid. Allow elements to breathe; use expansive negative space to create a sense of "calm." Overlap glass cards with blurred background orbs to create a sense of physical depth, as if the user is looking through layers of a nebula.

---

## 2. Colors & Tonal Depth

Our palette is rooted in the "Deep Violet" spectrum, using light and shadow to create intimacy rather than harsh lines.

### The Palette (Material Design Tokens)
*   **Background (Base):** `#180f24` (Surface)
*   **Primary (Accents):** `#ffadf9` (Soft Fuchsia)
*   **Secondary (Atmosphere):** `#d4bbff` (Soft Violet)
*   **Surface Tiers:** 
    *   `surface_container_lowest`: `#130a1f` (Deepest shadows)
    *   `surface_container_highest`: `#3a3047` (Brightest elevated surfaces)

### The "No-Line" Rule
Sectioning must never be achieved with 1px solid strokes. To separate content, use **Tonal Shifts**. A card should be defined by its `surface_container_low` background sitting against the `surface` background. If the separation feels too weak, increase the `backdrop-blur` (20px–40px) rather than adding a line.

### The "Glass & Gradient" Rule
Standard flat colors are prohibited for primary actions. 
*   **Signature Gradients:** Use a transition from `primary` (#ffadf9) to `primary_container` (#ff77ff) at a 135-degree angle. 
*   **Glassmorphism:** Floating cards must use `on_surface` at 5%–8% opacity with a heavy `backdrop-filter: blur(12px)`. This ensures the "celestial" background orbs bleed through the UI, maintaining a sense of place.

---

## 3. Typography: The Editorial Voice

We use **Geist** (Modern Sans-serif) to maintain a tech-forward feel, but we style it with high-contrast scales to feel like a premium magazine.

*   **Display & Headlines:** Use `display-lg` (3.5rem) with wide letter-spacing (-0.02em). For landing moments, use **Light Italics** to convey movement and romance.
*   **The Hierarchy of Intimacy:**
    *   **Headlines (`headline-lg`):** Reserved for "Moments" or "Milestones."
    *   **Body (`body-lg`):** Set in `manrope` for high legibility in long-form private notes.
    *   **Labels (`label-md`):** Use `inter` at 0.75rem for metadata, always in `on_surface_variant` to keep them secondary.

---

## 4. Elevation & Depth: Tonal Layering

In this system, depth is "grown," not "built."

*   **The Layering Principle:** Treat the UI as stacked sheets of frosted obsidian. 
    *   *Level 0:* Deep background (`surface_container_lowest`) with blurred fuchsia orbs.
    *   *Level 1:* Main content area (`surface`).
    *   *Level 2:* Interactive cards (`surface_container_low`).
*   **The Ghost Border:** If accessibility requires a container edge, use a `1px` border using `outline_variant` at **10% opacity**. It should be felt, not seen.
*   **Ambient Shadows:** For high-priority floating elements (like a "Send Message" fab), use a shadow tinted with `primary`: 
    *   `box-shadow: 0 20px 40px rgba(255, 173, 249, 0.08);`

---

## 5. Components

### Buttons
*   **Primary:** Gradient (`primary` to `primary_container`), `0.75rem` (md) corner radius. Text is `on_primary_fixed` (Deep Purple) for maximum legibility.
*   **Secondary:** Ghost style. No background, `Ghost Border` (10% white), `primary` colored text.

### Circular Avatars
*   **Style:** Never use plain grey placeholders. Use a **Radial Gradient** (Secondary to Primary) behind the user's initials. This maintains the "Celestial" theme even when photos are missing.

### Input Fields
*   **State:** Background should be `surface_container_highest` at 40% opacity. 
*   **Focus:** Do not use a heavy glow. Transition the `Ghost Border` from 10% to 30% opacity and slightly shift the background hue toward `primary`.

### Cards & Lists
*   **Forbid Dividers:** Do not use horizontal lines between list items. Use **24px (xl) vertical spacing** to let the content breathe.
*   **The "Toi et Moi" Special Component - *The Memory Orb*:** A circular glass container used for highlights. It uses `backdrop-blur(20px)` and a very subtle inner glow (top-left) to simulate a 3D glass sphere.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts (e.g., a headline aligned left with a sub-headline offset 40px to the right).
*   **Do** use "Breathing Room." If you think there is enough padding, add 8px more.
*   **Do** ensure all "Glass" elements have a `backdrop-filter`. Glass without blur is just a low-opacity box.

### Don’t:
*   **Don’t** use pure black (#000). Our darkest dark is `#130a1f`. Pure black kills the "Nebula" depth.
*   **Don’t** use standard Material shadows. They are too "industrial" for this romantic context.
*   **Don’t** use 100% opaque borders. They create "visual noise" that disrupts the calm.