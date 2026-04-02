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

- the map is so tiny when creating a listing. It needs to be about double the size.
