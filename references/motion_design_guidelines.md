# Motion Design Guidelines for Codebase Visualization

## Visual Hierarchy & Cognitive Load
1. **Rule of 3**: Never introduce more than 3 new concepts, cards, or active arrows in a single scene.
2. **Focus & Blur/Dim**: When zooming into or spotlighting a subsystem (e.g. Supabase Trigger or Firestore Rule), dim background components to 20-30% opacity with a subtle scale down (`0.95`).
3. **Data Packet Motion**: Use moving glowing dots along bezier SVG curves to illustrate network requests, RPC calls, and database writes. Fast pulses indicate high-frequency caching; steady pulses indicate persistent transactions.
4. **Color Tokens**:
   - Cyan (`#06b6d4`): APIs, Route Handlers, Client Entry Points
   - Indigo / Violet (`#6366f1` / `#8b5cf6`): Core Business Logic, Compute, Validation
   - Emerald (`#10b981`): PostgreSQL / Supabase, Relational Data, Persistent Storage
   - Amber / Orange (`#f59e0b`): Firestore, Document DB, Leaderboards
   - Rose / Red (`#f43f5e`): Security Rules, Auth Guards, Row Level Security (RLS)
5. **Frame-Rate & Easing**:
   - Render at 30 FPS or 60 FPS for fluid playback.
   - Use cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`) for entrances (smooth deceleration).
