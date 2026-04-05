# Complete Microsoft Word-Like Tiptap Editor Implementation Prompt

## For Claude (Copy & Paste to Claude.ai or use via API)

```
Build a complete, production-ready React component that creates a FULL-FEATURED MICROSOFT WORD-LIKE RICH TEXT EDITOR using Tiptap v2. This editor should have ALL the functionality and features of Microsoft Word.

=== EDITOR SPECIFICATIONS ===

### 1. APPLICATION LAYOUT & HEADER
- Application title bar with: "Document Editor" and current document name
- Top menu bar with: File, Edit, View, Insert, Format, Tools, Help
  - File menu: New, Open, Save, Save As, Export, Print, Close
  - Edit menu: Undo, Redo, Cut, Copy, Paste, Select All, Find & Replace
  - View menu: Show Ruler, Show Formatting Marks, Dark Mode Toggle, Zoom
  - Insert menu: Link, Image, Table, Header/Footer, Page Break, Shapes
  - Format menu: Font, Paragraph, Styles, Lists, Borders, Shading
  - Tools menu: Word Count, Spell Check, Language
  - Help menu: About, Documentation
- Gradient header background (blue to purple)
- White text on gradient background
- Modern professional appearance

### 2. COMPREHENSIVE TOOLBAR (EXACTLY LIKE MS WORD)

#### Row 1: Font & Size Controls
- Font Family Selector (Dropdown):
  * Arial, Arial Black, Courier New, Georgia, Times New Roman, Trebuchet MS, Verdana, Calibri, Cambria, Garamond, Palatino Linotype, Segoe UI, Comic Sans MS
  * Current font displayed
  * Search/filter capability
- Font Size Selector (Dropdown):
  * 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96
  * Custom size input allowed
  * Increment/Decrement buttons (+/-)

#### Row 2: Text Formatting Buttons
- Bold (B) - Ctrl+B - Active state indicator
- Italic (I) - Ctrl+I - Active state indicator
- Underline (U) - Ctrl+U - Active state indicator
- Strikethrough (S) - Cross-out effect
- Subscript (X₂) - Chemical formula support
- Superscript (X²) - Exponent support
- Clear Formatting (Eraser icon) - Removes all formatting

#### Row 3: Text Color & Highlighting
- Font Color Picker:
  * Full color palette (standard web colors)
  * Recent colors section
  * Dropdown arrow for color selection
  * Shows current color swatch
- Text Highlight/Background Color:
  * Full color palette
  * Separate from font color
  * Fluorescent highlight colors available
  * Recent colors section
- Color Preview: Show selected color in swatch

#### Row 4: Paragraph Formatting
- Paragraph Alignment Buttons:
  * Left Align (⬅) - Ctrl+L
  * Center Align (↔) - Ctrl+E
  * Right Align (➡) - Ctrl+R
  * Justify (≡) - Ctrl+J
  * Active state shows which alignment is current
- Line Spacing Dropdown:
  * Single spacing (1.0)
  * 1.5 spacing
  * Double spacing (2.0)
  * Custom spacing option (opens dialog)
  * Paragraph spacing before/after
- Indentation Controls:
  * Increase Indent (→)
  * Decrease Indent (←)
  * First line indent
  * Left indent
  * Right indent
  * Hanging indent

#### Row 5: Lists & Styles
- Bullet List Button:
  * Toggle bullet points
  * Multiple bullet styles available (•, ○, ■, ✓)
  * Dropdown for bullet type selection
- Numbered List Button:
  * Toggle numbered list
  * Multiple numbering styles (1, 2, 3... or a, b, c... or i, ii, iii... or A, B, C...)
  * Dropdown for number type selection
  * Multilevel list support
- Styles Dropdown:
  * Normal/Body Text
  * Heading 1, Heading 2, Heading 3, Heading 4, Heading 5, Heading 6
  * Title
  * Subtitle
  * Quote
  * Code
  * List Paragraph
  * Shows current style in use
  * Preview of each style
  * Custom style creation

#### Row 6: Insert Objects
- Link Button:
  * Opens dialog with URL field
  * Link text field
  * Link target (current tab / new tab)
  * Remove link option
  * Edit existing links
- Image Button:
  * Upload from computer
  * Insert by URL
  * Search for images
  * Image properties dialog (width, height, alt text)
  * Crop, rotate, brightness, contrast controls
- Table Button:
  * Table creation dialog (rows × columns)
  * Quick size selector (1×1 to 5×5 grid)
  * Predefined table templates
  * Convert text to table
- Shape Button:
  * Basic shapes (rectangle, circle, arrow, star, etc.)
  * Flowchart shapes
  * Callout shapes
  * Lines and connectors
- Text Box Button:
  * Insert floating text box
  * Formatted text inside
  * Position and size controls
- Chart/Graph Button:
  * Insert chart types (bar, line, pie, area)
  * Data entry
  * Chart formatting
- Header & Footer Button:
  * Add/edit header on every page
  * Add/edit footer on every page
  * Different first page option
  * Different odd/even pages option
  * Automatic page numbers
- Page Break Button:
  * Insert manual page break
  * Column break
  * Section break

#### Row 7: Paragraph Borders & Shading
- Borders Dropdown:
  * No borders
  * Box/All borders
  * Left, Right, Top, Bottom only
  * Specific border combinations
  * Line style selector (solid, dashed, dotted, double, etc.)
  * Line weight/thickness
  * Border color picker
  * Preview of selected border style
- Shading/Background Color:
  * Paragraph background color (different from text highlight)
  * Color palette
  * Recent colors
  * No color option (transparent)

#### Row 8: Special Characters & Utilities
- Subscript (X₂) Button
- Superscript (X²) Button
- Insert Special Character Button:
  * Symbol picker dialog
  * Recently used symbols
  * Unicode support
  * Search by name
- Fields Button:
  * Date field (auto-update)
  * Time field (auto-update)
  * Page number
  * Total pages
  * Document title
  * Author name
- Undo (↶) Button:
  * With dropdown history showing last 20 actions
  * Click to jump to any previous state
- Redo (↷) Button:
  * With dropdown history
  * Click to jump to any future state
- Cut (✂) Button - Ctrl+X
- Copy (📋) Button - Ctrl+C
- Paste (📌) Button - Ctrl+V
  * With paste special options
  * Paste formatting only
  * Paste unformatted text

#### Row 9: Find & Replace
- Find Box:
  * Real-time search highlighting
  * Case sensitive option
  * Whole word option
  * Search results count
  * Navigate to next/previous result
- Replace Box:
  * Replace current
  * Replace all
  * Dropdown history of searches
  * Advanced find & replace dialog
- Zoom Controls:
  * Zoom percentage (25% to 400%)
  * Preset zoom levels (75%, 100%, 125%, 150%, 200%, Fit Page, Fit Width)
  * Zoom slider
  * Zoom +/- buttons

### 3. RULER (OPTIONAL BUT INCLUDED)
- Horizontal ruler showing:
  * Measurements in inches/cm (switchable)
  * Left indent marker
  * Right indent marker
  * First line indent marker
  * Tab stops (configurable)
  * Page width indicator
- Vertical ruler (optional)
- Drag-and-drop indent adjustment
- Tab stop configuration
- Click ruler to set custom measurements

### 4. FORMATTING PANEL (SIDEBAR)
- Styles panel:
  * All available styles
  * Current style highlighted
  * Quick style application
  * Custom style creation
  * Modify style dialog
- Paragraph formatting panel:
  * Quick access to alignment, spacing, indentation
  * Preview of current paragraph style
- Font panel:
  * Recent fonts
  * Font size presets
  * Quick format buttons

### 5. MAIN EDITOR AREA
- Large, spacious editing area
- Minimum height: 600px
- White background with page-like appearance
- Page borders/shadows to simulate printed page
- Proper margins (1 inch default):
  * Top: 1"
  * Bottom: 1"
  * Left: 1"
  * Right: 1"
- Adjustable margins via dialog or ruler
- Line numbers (optional, toggleable)
- Paragraph marks (toggleable visibility):
  * ¶ at end of each paragraph
  * Show/hide via View menu
- Tab symbols (toggleable visibility)
- Space symbols (toggleable visibility)
- Cursor blinking in editor
- Real-time spell check:
  * Red squiggly lines under misspelled words
  * Right-click for suggestions
  * Add to dictionary option
- Grammar check:
  * Blue squiggly lines for grammar issues
  * Context suggestions
  * Ignore suggestion option

### 6. TABLE FEATURES (COMPLETE)
- Table Insertion:
  * Modal dialog for rows/columns (1-20 each)
  * Quick size grid (drag to select size)
  * Predefined table templates
  * Convert text to table
- Table Editing:
  * Select entire table/rows/columns/cells
  * Insert rows (before/after/multiple)
  * Insert columns (before/after/multiple)
  * Delete rows/columns/table
  * Merge cells
  * Split cells
  * Resize columns (drag handle or fixed width)
  * Resize rows (drag handle or fixed height)
  * Auto-fit column width to content
  * Auto-fit row height to content
- Table Formatting:
  * Table styles (predefined or custom)
  * Table borders (color, style, width)
  * Cell background/shading color
  * Cell text alignment (vertical and horizontal)
  * Cell margins/padding
  * Table alignment (left, center, right)
  * Table indent from margin
- Table Navigation:
  * Tab to next cell
  * Shift+Tab to previous cell
  * Arrow keys to move between cells
  * Ctrl+Home to first cell
  * Ctrl+End to last cell
- Header Row Options:
  * Toggle header row
  * Repeat header on each page
  * Header formatting different from body

### 7. DOCUMENT PROPERTIES & METADATA
- Document Title
- Author Name
- Document Created Date
- Last Modified Date
- Comments/Notes
- Tags/Keywords
- Category
- Subject
- View all properties dialog

### 8. PAGE SETUP & LAYOUT
- Page Size Selector:
  * Letter (8.5" × 11")
  * Legal (8.5" × 14")
  * A4 (210 × 297 mm)
  * A3, A5, B4, B5
  * Tabloid
  * Custom size dialog
  * Orientation toggle (Portrait/Landscape)
- Margins Dialog:
  * Top, Bottom, Left, Right (in inches/cm)
  * Gutter margin
  * Mirror margins option
  * Different first page margins
  * Different odd/even page margins
- Columns:
  * Single column (default)
  * 2 columns
  * 3 columns
  * Custom number of columns
  * Column width and spacing
  * Line separator between columns
- Sections:
  * Different formatting for different sections
  * Section breaks
  * Restart page numbering per section
  * Different headers/footers per section

### 9. HEADERS & FOOTERS
- Add header to document
- Add footer to document
- Edit header/footer content
- Different first page (no header/footer on first page)
- Different odd/even pages (mirror formatting)
- Page numbers:
  * Automatic page numbering
  * Custom starting number
  * Page numbering format
  * Total page count
  * Current section number
- Date/time fields:
  * Automatic date insertion
  * Automatic time insertion
  * Update on open option
  * Date/time format options
- Document title in header/footer
- Author name in header/footer

### 10. EXPORT & SAVE OPTIONS
- Save Document:
  * Save as .docx (Microsoft Word format)
  * Save as .doc (Legacy Word format)
  * Save as .odt (OpenDocument format)
  * Save as .pdf (PDF format)
  * Save as .html (HTML format)
  * Save as .txt (Plain text)
  * Save as .rtf (Rich Text Format)
  * Auto-save every 5 minutes
  * Save location selection
  * Recent files list
- Export Options:
  * Export to PDF with settings:
    - Paper size
    - Margins
    - PDF quality
    - Page range (all / current / custom)
    - Include/exclude comments
    - Include/exclude hyperlinks
  * Export to HTML with settings:
    - Include CSS styling
    - Image handling (embed / link)
    - Self-contained HTML
  * Export to image (PNG, JPG):
    - Page range
    - Resolution/DPI
    - Quality settings
- Print Preview:
  * Preview pages before printing
  * Page navigation
  * Zoom in print preview
  * Print settings in preview
  * Print range selection
  * Copies count
  * Print layout options
- Print:
  * Select printer
  * Paper size
  * Orientation
  * Margins
  * Print quality
  * Page range (all / current / custom)
  * Print preview button
  * Print to PDF option

### 11. FIND & REPLACE DIALOG
- Find Options:
  * Search text input
  * Case sensitive
  * Whole word only
  * Match beginning of word
  * Phonetic search (if language supports)
  * Wildcard search
  * Find all button (highlights all matches)
  * Find next / Find previous
  * Results count
- Replace Options:
  * Replace text input
  * Replace current occurrence
  * Replace all occurrences
  * Undo replace all option
  * Format search and replace
  * Advanced options button
  * Replace with formatting/styles
- Search History:
  * Recent searches dropdown
  * Recent replacements dropdown
  * Clear history option

### 12. WORD COUNT & STATISTICS
- Word Count Display:
  * Total words
  * Total characters (with/without spaces)
  * Total paragraphs
  * Total pages
  * Total lines
  * Average words per paragraph
  * Average characters per word
  * Reading time estimate
  * Exclude headers/footers option
- Automatic Update:
  * Real-time update as user types
  * Manual refresh button
  * Status bar display

### 13. STYLES & FORMATTING PANEL
- Built-in Styles:
  * Paragraph styles (Normal, Heading 1-6, Title, Subtitle, Quote, etc.)
  * Character styles (Strong, Emphasis, Code, etc.)
  * List styles (Bullet, Numbered, Multilevel)
  * Table styles
- Style Management:
  * Create new style dialog
  * Modify existing style
  * Delete custom styles
  * Import/export styles
  * Style preview
  * Based on / Style for following paragraph
  * Font settings for style
  * Paragraph settings for style
  * Advanced style properties
- Quick Styles:
  * 5-10 quick access style buttons
  * Style suggestions
  * Clear direct formatting option

### 14. STATUS BAR (Bottom)
- Page count: "Page 1 of 5"
- Word count: "Words: 2,534"
- Character count: "Characters: 14,892"
- Language: "English (US)"
- Zoom percentage: "100%"
- Zoom slider
- Track changes indicator (if enabled)
- Comments count (if any)
- Document mode indicator (Read-only / Editing)

### 15. COLLABORATION FEATURES
- Comments:
  * Add comment to selected text (Ctrl+Alt+M)
  * Reply to comments
  * Resolve comment
  * Delete comment
  * Comment indicator in margin
  * Comments panel showing all
- Track Changes:
  * Turn track changes on/off
  * Show insertions/deletions
  * Show formatting changes
  * Highlight color for changes
  * Accept/Reject changes dialog
  * Accept all/Reject all
  * Navigate to next/previous change
  * Changes summary

### 16. ACCESSIBILITY FEATURES
- ARIA labels on all controls
- Keyboard navigation support:
  * Alt+F - File menu
  * Alt+E - Edit menu
  * Alt+V - View menu
  * Alt+I - Insert menu
  * Ctrl+Home - Start of document
  * Ctrl+End - End of document
  * F7 - Spell check
  * F5 - Go to page dialog
  * Tab/Shift+Tab - Navigate toolbar
- High contrast mode
- Screen reader support
- Text size adjustment
- Color blind mode

### 17. SECURITY & PROTECTION
- Document encryption (password protection)
- Read-only mode
- Mark as final (prevent editing)
- Restrict formatting:
  * Allow only certain styles
  * Prevent direct formatting
- Comments-only mode
- Protection dialog with password
- Unprotect document option

### 18. RESPONSIVE DESIGN
- Desktop (> 1200px):
  * Full toolbar with all controls
  * Sidebar with styles/formatting
  * Horizontal ruler
  * Status bar with all info
- Tablet (768px - 1200px):
  * Condensed toolbar with dropdowns
  * Floating formatting panel
  * Ruler hidden by default
  * Status bar with essential info
- Mobile (< 768px):
  * Simplified toolbar
  * Full-width editor
  * Bottom sheet for formatting options
  * Floating action button for insert/format

### 19. TECHNICAL IMPLEMENTATION

**React Structure:**
```
EditorApp.jsx
├── Header.jsx (menu bar)
├── Toolbar.jsx (formatting toolbar)
├── Ruler.jsx (optional)
├── SidePanel.jsx (styles/formatting)
├── EditorContent.jsx (main editor with Tiptap)
├── StatusBar.jsx (word count, etc)
└── Modals/
    ├── SaveDialog.jsx
    ├── TableDialog.jsx
    ├── LinkDialog.jsx
    ├── FindReplaceDialog.jsx
    ├── PageSetupDialog.jsx
    └── DocumentPropertiesDialog.jsx
```

**Tiptap Extensions Required:**
- StarterKit
- TextStyle
- Color
- Highlight
- Link
- Image
- Table, TableRow, TableHeader, TableCell
- TaskList
- TaskItem
- Blockquote
- CodeBlock (with syntax highlighting)
- HorizontalRule
- HardBreak
- Underline
- Subscript
- Superscript
- Strike

**State Management:**
- React Context API or Redux
- Document state (title, content, properties)
- UI state (active styles, toolbar visibility, etc)
- Editor state (cursor position, selection, etc)
- Settings state (view options, user preferences)

**Storage:**
- localStorage for auto-save (with version control)
- IndexedDB for larger documents
- Optional: Backend API for cloud sync

### 20. STYLING & APPEARANCE
- Professional Microsoft Office-inspired design
- Modern color scheme:
  * Primary: #2563eb (blue)
  * Secondary: #7c3aed (purple)
  * Accent: #dc2626 (red for warnings)
  * Neutral: #6b7280 (gray)
- Clean, minimalist UI
- Proper spacing and typography
- Smooth animations and transitions
- Shadow effects for depth
- Focus indicators for accessibility
- Consistent icon style

### 21. PERFORMANCE OPTIMIZATION
- Lazy load components
- Memoize expensive operations
- Virtual scrolling for large documents
- Debounce input handlers
- Optimize re-renders
- Image lazy loading
- CSS-in-JS or external stylesheets (tree-shakeable)

### 22. ERROR HANDLING & VALIDATION
- Auto-recovery from crashes
- Document corruption detection
- File format validation
- Maximum document size warnings
- Network error handling for cloud features
- User-friendly error messages
- Retry mechanisms

DELIVERABLES:

Create a complete, production-ready React component system that:

✅ Provides complete Microsoft Word equivalent functionality
✅ Has comprehensive menu system (File, Edit, View, Insert, Format, Tools, Help)
✅ Includes 9-row professional formatting toolbar
✅ Supports all text formatting (bold, italic, underline, colors, fonts, sizes)
✅ Complete table creation and manipulation with all features
✅ Headers and footers with page numbers and auto-fields
✅ Page setup and layout controls
✅ Find and replace functionality
✅ Real-time spell check and grammar check
✅ Word count and document statistics
✅ Styles management and quick styles
✅ Comments and track changes
✅ Export to multiple formats (DOCX, PDF, HTML, TXT, RTF, ODT)
✅ Print preview and print functionality
✅ Document properties and metadata
✅ Responsive design (desktop, tablet, mobile)
✅ Accessibility features and ARIA support
✅ Security and document protection options
✅ Auto-save functionality
✅ Professional appearance with gradient headers
✅ Status bar with real-time information
✅ Ruler with indent markers and tab stops
✅ Undo/Redo with history dropdown
✅ Collaborative features (comments, track changes)
✅ Complete keyboard shortcuts support
✅ Performance optimized
✅ Well-documented and commented code
✅ Production-ready and enterprise-grade

All components should follow React best practices, use hooks for state management, and be fully integrated with Tiptap v2 for rich text editing. The editor should feel professional, responsive, and handle all edge cases gracefully.
```

=== END OF PROMPT ===

```

