## UI

- not able to edit menu items
  - **PARTIALLY FIXED (Phase 2):** can now add and delete menu items on the edit page.
    `updateMenuItem` is imported in `CartForm.tsx` but not wired to any UI — inline
    editing of an existing item's name/price/description is still not implemented.

- menu item creation ui is a little confusing
  - I kept clicking the "save changes" button that would kick me out of the listing and NOT save the menu item I was trying to create.
  - so make the "+ add item" button needs to be more obvious or the save changes button needs to be not so close to the new item I'm creating
  - **FIXED (Phase 2):** add-item inputs now live in a dashed-border section visually
    separated from the Save/Cancel buttons. The `+ Add Item` button is `type="button"`,
    so it never accidentally submits the form.

- the map is so tiny. I would like it to be bigger on the screen.
  - **IMPROVED (Phase 2):** `MapPicker` is now `h-72` (288 px). May still want to revisit
    if it still feels cramped.


## Next.js

1 of 1 error
Next.js (14.2.35) is outdated (learn more)

Unhandled Runtime Error
Error: Map container is already initialized.

components/MapPicker.tsx (35:21) @ map
```tsx
    });
    const map = L.map(containerRef.current!, {
                  ^
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
```
**FIXED (Phase 2):** `MapPicker.tsx` now guards with `if (mapRef.current) return` on
mount and calls `mapRef.current?.remove()` in the effect cleanup, preventing double
initialisation on React strict-mode double-invocation.
