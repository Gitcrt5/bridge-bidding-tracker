# Bridge Bidding Tracker - Design Guidelines

## Brand Identity

**Purpose**: A professional tool for serious bridge players to track and analyze their bidding sequences during duplicate bridge games.

**Aesthetic Direction**: Editorial/Professional - Clean typography, organized data tables, focused on efficiency and clarity. The app should feel like a well-designed scoresheet come to life - functional, trustworthy, and precise.

**Memorable Element**: The traditional bidding table display with precise suit symbols and color-coded bids creates instant familiarity for bridge players.

## Navigation Architecture

**Root Navigation**: Stack-based (linear flow from game list → game creation → bidding entry)

**Screen List**:
1. Game List - View all recorded games
2. Game Creation - Set up new game parameters
3. Bidding Entry - Record bidding, results, and notes for each board

## Screen-by-Screen Specifications

### 1. Game List Screen
**Purpose**: Browse and select recent games, create new game

**Layout**:
- Header: Default navigation header, title "My Games", right button "+" to create new game
- Main content: Scrollable list of game cards
- Safe area insets: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl

**Components**:
- Game cards showing: date (formatted as "Jan 15, 2025"), tournament name (bold), partner name, location (secondary text)
- Empty state when no games exist (show empty-games.png illustration with "No Games Yet" message)
- Each card is tappable to view game details (navigate to Bidding Entry for board 1)

### 2. Game Creation Screen
**Purpose**: Configure new game parameters

**Layout**:
- Header: Default navigation header with "Cancel" left button, "Create" right button (disabled until required fields filled)
- Main content: Scrollable form
- Safe area insets: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl

**Components**:
- Date picker row (defaults to today)
- Text input: Partner name (required)
- Text input: Location
- Number input: Boards (default 36, picker or stepper)
- Segmented control: Movement type (Howell, Mitchell, Arrow Switch)
- Text input: Tournament name (required)
- Submit/cancel in header (not below form)

### 3. Bidding Entry Screen
**Purpose**: Record bidding sequences, alerts, notes, and results for each board

**Layout**:
- Header: Custom header with board navigation
  - Left: Back button to game list
  - Center: "Board [X] of [Total]" with left/right arrows
  - Right: Jump button (shows board picker modal)
- Board info bar: Dealer (e.g., "Dealer: N"), Vulnerability (e.g., "Vul: None/NS/EW/Both")
- Main content: Scrollable view with sections
- Safe area insets: top = headerHeight + Spacing.xl, bottom = insets.bottom + Spacing.xl

**Sections** (in order):
1. **Bidding Table**: 4-column grid (N/E/S/W) with entered bids displayed in rows. Auto-rotates dealer position based on board number.
2. **Bidding Input Panel**:
   - Row 1: Level buttons (1-7) in horizontal scroll
   - Row 2: Suit buttons (♣♦♥♠ NT) with color coding (♣ black, ♦ orange-red, ♥ red, ♠ black)
   - Row 3: Special bids (Pass, Double, Redouble)
   - Alert button (toggles alert mode - when active, next bid selected opens alert text modal)
3. **Alerts Section**: List of alerts for this board (bid + alert text), tappable to edit
4. **Notes Section**: Multi-line text input for board notes
5. **Result Entry**:
   - Tricks taken: Picker (0-13)
   - Lead card: Two-part picker (Rank: 2-9TJQKA, Suit: ♣♦♥♠)
   - Score: Text input field
6. **Save & Next Button**: Floating button at bottom, saves current board and advances to next

## Color Palette

**Primary**: #1B5E96 (Professional blue, conveys trust and precision)
**Accent**: #D4692C (Warm terracotta for hearts/diamonds)
**Background**: #FFFFFF (Clean white for data clarity)
**Surface**: #F8F9FA (Light gray for cards and sections)
**Text Primary**: #1A1A1A (Near-black for readability)
**Text Secondary**: #6B7280 (Medium gray for supporting info)
**Border**: #E5E7EB (Light gray for dividers)
**Success**: #059669 (Confirming actions)
**Semantic Colors**:
- Clubs: #1A1A1A (Black)
- Diamonds: #D4692C (Orange-red)
- Hearts: #DC2626 (Red)
- Spades: #1A1A1A (Black)

## Typography

**Font**: System (SF Pro on iOS for optimal legibility at small sizes)
**Type Scale**:
- Title: 28pt, Bold
- Headline: 20pt, Semibold
- Body: 16pt, Regular
- Caption: 14pt, Regular
- Bid Display: 18pt, Medium (for bidding table cells)

## Visual Design

- Icons: System SF Symbols (plus/minus, arrow.left/arrow.right, ellipsis)
- Touchable elements: Light background change on press (opacity 0.7)
- Cards: 12px corner radius, subtle border (1px, Border color)
- Buttons: 8px corner radius, medium tap feedback
- Bidding buttons: Circular or pill-shaped for visual distinction
- Alert mode: When active, highlight border around bidding input panel

## Assets to Generate

1. **icon.png** - App icon featuring bridge card suits (♣♦♥♠) arranged in a square grid, professional style
   - WHERE USED: Device home screen

2. **splash-icon.png** - Simplified version of app icon
   - WHERE USED: App launch screen

3. **empty-games.png** - Illustration of an empty scoresheet or card table
   - WHERE USED: Game List Screen empty state