# Duolingo learning path & lesson flow — research notes for Peakelo

**Purpose:** Extract progressive-disclosure patterns from Duolingo’s own writing (path, units, nodes, lessons) so Peakelo can borrow *structure*, not brand, XP economy, or mascot theater.

**Scope rule:** Primary sources only — `blog.duolingo.com` and Duolingo help/FAQ surfaces under `duolingo.com/help` / `support.duolingo.com`. No third-party walkthroughs. Claims below are cited to a URL. Screens not described in those pages are **not** invented.

**Date researched:** 2026-09-25

---

## Sources used

| URL | What it covers |
| --- | --- |
| https://blog.duolingo.com/new-duolingo-home-screen-design/ | Path redesign (2022), old vs new home, units, nodes, popups, gold levels, guidebook, jump navigation |
| https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/ | Course anatomy: units, bite-sized lessons, exercise ramp, path content types, gamification inventory |
| https://blog.duolingo.com/how-to-review-lessons-on-duolingo/ | Unit label, sections list, navigating completed vs future sections |
| https://blog.duolingo.com/ways-to-practice-in-duolingo/ | Node actions: new lesson, review, Legendary, Side Quests |
| https://blog.duolingo.com/time-spent-learning-well/ | What counts as a “path lesson” vs off-path activity |
| https://blog.duolingo.com/right-level-of-difficulty/ | Lesson content load (5–7 new words), scaffolding, path-embedded personalized practice |
| https://blog.duolingo.com/keeping-you-at-the-frontier-of-learning-with-adaptive-lessons/ | Inside-lesson adaptive exercise sequencing |
| https://blog.duolingo.com/duolingo-teaching-method/ | Lesson starts in doing; easier → harder exercises; optional hints |
| https://blog.duolingo.com/tips-for-maintaining-streak/ | Gold (“gilded”) nodes; Side Quest characters along path |
| https://blog.duolingo.com/how-to-learn-german-for-travel/ | Unit headers + guidebooks as the “what’s in this unit” surface; circles as path steps |
| https://blog.duolingo.com/adventures/ | Adventures as path-embedded nodes (later path content type) |
| https://blog.duolingo.com/product-highlights/ | Intermediate units split into smaller “chunks” (2025) |
| https://www.duolingo.com/help/updated-courses | Help FAQ: path position, “JUMP HERE?”, scroll-back review (content recovered via search snippet; page is a JS app shell when fetched without a browser) |
| Localized path FAQs (same redesign): https://blog.duolingo.com/pt/nova-pagina-inicial-duolingo/ , https://blog.duolingo.com/de/der-neue-duolingo-lernpfad-ist-da/ , https://blog.duolingo.com/es/nuevo-diseno-duolingo/ | Locked unit + “jump here” test language; same redesign claims |

### Access notes

- **`support.duolingo.com` / `duolingo.com/help`:** Help articles are client-rendered. Unauthenticated fetch returns an empty SPA shell (no article body). Where this doc cites help, it uses the **Updated Courses** FAQ text that appears in search indexes for `https://www.duolingo.com/help/updated-courses` — treat as Duolingo-owned help content, but note the live page was not fully readable as static HTML on 2026-09-25.
- **No paywall** on the blog posts listed above; all were readable in full.
- Blog image captions sometimes describe UI (e.g. “old tree” vs “new path”); those captions are treated as Duolingo’s own description of the UI.

---

## 1. What the home / path shows at a glance

### 1.1 The home is a single guided path

Duolingo replaced the old skill tree with a **path you follow step by step**. The redesign’s goal was to remove ambiguity about the “correct” next lesson and to make each step the intended next one for the learner’s goals.

Source: https://blog.duolingo.com/new-duolingo-home-screen-design/

### 1.2 Nodes (circles / levels / “pebbles”)

At a glance the path is a vertical series of **circles** (also called levels, nodes, or informally “pebbles”):

- **One circle = one level** — equated to **one crown level** of a skill on the old home screen.
- Circles sit on a **long scrollable path**; the path looks longer than the old tree because levels that used to sit inside one skill are **spread out**, and practice + Stories were **inserted into the path**.
- If you scroll away from your current spot, a **floating arrow** (bottom-right) jumps you back.

Sources:

- https://blog.duolingo.com/new-duolingo-home-screen-design/
- https://blog.duolingo.com/how-to-learn-german-for-travel/ (calls path steps “circles” / “pebbles”)

### 1.3 Unit headers (not per-node labels)

Lessons are **grouped into smaller units**. At the top of the visible path segment, Duolingo shows a **colorful unit label** that includes:

- section number  
- unit number  
- unit name  

Unit titles were rewritten to be **descriptive communication goals**, e.g. “get directions” / “discuss destinations” instead of opaque labels like “City 3” / “Travel 2”. Staff studying German used **unit titles and guidebooks at the top of each unit** to decide what content they would hit next (e.g. Unit 1 = “Order in a cafe, describe your family”).

Sources:

- https://blog.duolingo.com/new-duolingo-home-screen-design/
- https://blog.duolingo.com/how-to-review-lessons-on-duolingo/
- https://blog.duolingo.com/how-to-learn-german-for-travel/
- https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/ (units focus on communication goals)

**2025 refinement:** for intermediate learners (Duolingo Score over 60), units were broken into smaller **“chunks”** so the path feels less intimidating while remaining exercise-heavy.

Source: https://blog.duolingo.com/product-highlights/

### 1.4 Current vs done vs locked (what primary sources actually say)

| State | What Duolingo’s own posts say is visible / possible |
| --- | --- |
| **Done** | Completed levels become **gold** (“gilded” / “completed (gold)”). You can tap them again to **review** or attempt **Legendary**. Stories you’ve finished can be redone the same way. |
| **Current / next** | The path is meant to be followed **step by step**; the floating arrow returns you to your **current spot**. Path nodes that **move you down the path** are the primary learning object (new content, personalized practice, Stories, Unit Review). |
| **Locked / not yet open** | Units ahead can be **blocked**. Localized redesign FAQs describe scrolling to the **next locked unit** and using a **“Want to jump here?” / “Jump here”** circle; passing a **test** unlocks that unit. English help FAQ for updated courses also names a **“JUMP HERE?”** option **at the start of each unit**. |
| **Course complete** | When the whole course is gold, Legendary challenges sit **at the end of each unit**. |

Sources:

- Gold / revisit: https://blog.duolingo.com/new-duolingo-home-screen-design/ , https://blog.duolingo.com/tips-for-maintaining-streak/ , https://blog.duolingo.com/ways-to-practice-in-duolingo/
- Path-forward definition: https://blog.duolingo.com/time-spent-learning-well/
- Locked unit + jump test: https://blog.duolingo.com/pt/nova-pagina-inicial-duolingo/ , https://blog.duolingo.com/de/der-neue-duolingo-lernpfad-ist-da/ , https://www.duolingo.com/help/updated-courses

**Not claimed in primary sources (do not invent):** exact lock iconography, grey-vs-color node palette rules, whether multiple future nodes are dimmed vs only the next unit gate, or a detailed “current node pulse” animation — those are not spelled out in the pages above.

### 1.5 What else sits *on* the path (still “at a glance”)

Without opening a lesson, the path can show **different node kinds**, not only generic skill circles:

- Regular new lessons (vocab/grammar, speaking-focused, etc.)
- **Personalized practice** nodes
- **Stories** (book icon) — formerly a separate tab; now on the path
- **Unit Review**
- **DuoRadio** / headphones-style listening nodes (called out in Duolingo 101)
- **Adventures** — “video game-like experiences **in your Duolingo path**” (later feature)
- **Characters** along the sides of the path; as you move through a unit they go from **gray → full color**, each tied to a **Side Quest** (timed challenge with star checkpoints)

Sources:

- https://blog.duolingo.com/new-duolingo-home-screen-design/
- https://blog.duolingo.com/time-spent-learning-well/
- https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/
- https://blog.duolingo.com/adventures/
- https://blog.duolingo.com/tips-for-maintaining-streak/
- https://blog.duolingo.com/ways-to-practice-in-duolingo/

### 1.6 Guidebook entry point (unit-level, not per exercise)

For courses that had **Tips**, tips moved into a **“guidebook” for each unit**. The redesign post’s image caption places the guidebook control at the **top right of each unit** (after previously showing a guidebook icon before starting a lesson in an earlier layout). Unit guidebooks are also listed as a place to review content after finishing the course.

Source: https://blog.duolingo.com/new-duolingo-home-screen-design/

### 1.7 Section navigator (above the path)

Tapping the **unit label** opens a list of **sections**: completed, current, and following. Each section can show a **Duolingo Score** and CEFR / vocab-grammar detail. Choosing a past section opens that part of the path; **X** returns to your current place.

Source: https://blog.duolingo.com/how-to-review-lessons-on-duolingo/

---

## 2. What is hidden until you tap a node (or unit chrome)

Progressive disclosure pattern: the path is **sparse**; detail lives one tap away.

### 2.1 Node topic is not printed on every circle

FAQ: labels were removed from circles. **Tap a circle (level)** → **popup with information about the lesson topic**. Unit headers carry the broader “what you’ll learn” summary.

Source: https://blog.duolingo.com/new-duolingo-home-screen-design/

### 2.2 Start / review actions appear on tap

From practice-type posts (and screenshot descriptions on those pages):

- **New / current node:** start action (e.g. Story start) can show an XP reward string in the popup UI described in blog screenshots.
- **Completed (gold) node:** choose **quick review** *or* **Legendary** (harder exercises, no hints; node stays/turns gold after Legendary).
- **Locked unit gate:** “Jump here?” / “Want to jump here?” leads to a **placement-style test** for that unit (localized redesign FAQs + updated-courses help).

Sources:

- https://blog.duolingo.com/ways-to-practice-in-duolingo/
- https://blog.duolingo.com/new-duolingo-home-screen-design/
- https://blog.duolingo.com/pt/nova-pagina-inicial-duolingo/
- https://www.duolingo.com/help/updated-courses

### 2.3 Guidebook / tips body

Tips content lives in the **unit guidebook**, not inline on every node. Open it from the unit chrome when you want explicit instruction; the path itself prioritizes doing.

Sources:

- https://blog.duolingo.com/new-duolingo-home-screen-design/
- https://blog.duolingo.com/what-is-implicit-learning/ (explicit info in section overviews and unit guidebooks; priority remains *using* the language)

### 2.4 Section / CEFR detail

Grammar/vocab inventories and CEFR labels for a **section** appear after opening the unit-label sheet and drilling into section details — not as permanent chrome on every node.

Source: https://blog.duolingo.com/how-to-review-lessons-on-duolingo/

### 2.5 Placement and skip (entry, not every session)

On course start you may take a **placement test** to skip units, or start from the beginning and still **skip ahead one unit at a time**. Placement-marked complete lessons remain reviewable; placement itself is not undoable to “start from scratch.”

Source: https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/

---

## 3. How a single lesson is sequenced (one task at a time)

Primary sources describe **sessions made of sequential exercises**, not a multi-pane syllabus inside the lesson.

### 3.1 Session shape

- Lessons are **bite-sized** (“just a few minutes”; streak tips say the **average lesson takes ~5 minutes**).
- You **dive straight into interactive work** — “when you start a lesson… you dive right into what you want to learn.”
- A lesson is a **series of exercises**. Content and order are chosen so you start with **simpler material / easier exercise types**, then move to **more challenging** ones (e.g. recognize a new word early; **type it yourself** later).
- **Optional hints** and **bite-sized explanations** keep you on track without front-loading a lecture.
- Characters can **cheer between exercises**.

Sources:

- https://blog.duolingo.com/duolingo-teaching-method/
- https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/
- https://blog.duolingo.com/tips-for-maintaining-streak/

### 3.2 Content load per lesson

Each lesson introduces only a **handful of new words or structures** (explicitly **5–7 new words**), embedded in sentences built from already-taught material (“i + 1”). Hints keep new items in the learner’s zone of proximal development.

Source: https://blog.duolingo.com/right-level-of-difficulty/

### 3.3 Adaptive tail inside the same lesson

During a **new lesson**, Duolingo measures performance and can **replace the last few exercises in real time** with harder items from higher levels if the learner is answering well. Practice on gold content and mistakes practice also adapt.

Source: https://blog.duolingo.com/keeping-you-at-the-frontier-of-learning-with-adaptive-lessons/

### 3.4 Unit-level ramp (across lessons, still progressive)

Within a unit: **easier exercise types first**, then harder; each unit also includes **personalized practice** aimed at due review items and the learner’s mistakes. Speaking, writing, reading, and listening are integrated so the learner does not pick the next skill.

Source: https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/

### 3.5 Mistake handling inside lessons (exists; Peakelo out of scope for the *economy*)

Wrong answers cost **hearts**; after five mistakes free users must practice to earn hearts back (subscribers get unlimited hearts). That is product friction on the lesson loop — documented here only as “it exists,” not as something to copy.

Source: https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/

### 3.6 What primary sources do **not** specify

Do **not** treat the following as documented from Duolingo’s blog/help (even if common in the wild app):

- Exact exercise count per lesson  
- Whether a lesson progress bar is always shown  
- Exact end-of-lesson summary screens  
- Pixel-level “one full-screen task, swipe to next” interaction model  

What *is* documented: sequential exercises, escalating difficulty, small new-item budget, optional help, adaptive ending exercises.

---

## 4. What they explicitly rejected (the old branching tree)

### 4.1 Old home model

On the **old** home screen:

- Content lived in **skills** (colorful circles in a tree / row layout).
- Each skill had **5 crown levels** (+ Legendary).
- Each level contained **several lessons**.
- Learners often **jumped around**, leveled one skill to gold before moving on, or chased **“cracked”** skills for review.
- **Stories** sat in a **separate tab**; **Tips** were harder to find.
- Monthly challenges / quests and Practice Hub were less discoverable in the bottom chrome.

The redesign post frames the problem as learners **not knowing whether they were using Duolingo the “correct” or “best” way**, and wanting clearer guidance through lessons.

Source: https://blog.duolingo.com/new-duolingo-home-screen-design/

### 4.2 New default = what they used to *recommend* as optional technique

Previously Duolingo recommended **“hovering”** (mix nearby skills; don’t only gold-then-advance). The path **makes that ordering the default**: levels from different skills are **interspersed**; you see a mix of **brand-new** and **review** concepts (spaced repetition). Crowns as the progress metaphor are replaced by **position on the path**.

Sources:

- https://blog.duolingo.com/new-duolingo-home-screen-design/
- https://blog.duolingo.com/whats-the-best-way-to-learn-with-duolingo/ (hover method they codified into the path)

### 4.3 Structural rejection summary

| Rejected / demoted | Replaced by |
| --- | --- |
| Branching skill tree where many skills feel equally “next” | Linear **guided path** |
| Learner-chosen skill grinding / crown farming as primary navigation | **Ordered** mix of concepts + built-in practice |
| Separate Stories tab as the default home for stories | Stories **on the path** |
| Per-skill tips discovery friction | **Unit guidebook** |
| “Cracked skill” chase as the review model | Practice **on the path** (and optional gold-node review) |
| Crowns as the main progress chrome | Path position (+ later Score / section model) |

Source: https://blog.duolingo.com/new-duolingo-home-screen-design/

---

## 5. What Peakelo should **not** copy (note: they exist)

These appear throughout Duolingo’s own product writing. **Mark out of scope** for Peakelo’s progressive-disclosure work. Borrow path/lesson *structure*, not the arcade layer or subscription funnel.

| Feature | Duolingo’s own description (proof it exists) | Peakelo stance |
| --- | --- | --- |
| **XP** | Earned for lessons, Stories, practice, timed challenges; drives Leaderboards; path XP weighted higher in TSLW experiments | **Out of scope** |
| **Gems** | In-app currency; shop for Streak Freezes, timer boosts, etc. | **Out of scope** |
| **Hearts** | Lose a heart per wrong exercise; five mistakes → practice/buy/subscribe | **Out of scope** |
| **Streaks** | Daily flame; extend with one lesson; Freezes; challenges | **Out of scope** |
| **Super / Max upsell** | Unlimited hearts, no ads, Practice Hub extras, Max AI features (Video Call, Roleplay, etc.) | **Out of scope** |
| **Leaderboards / leagues** | Weekly XP competition | **Out of scope** |
| **Friends Quests / social Feed** | Social quests, friend streaks, feed | **Out of scope** |
| **Match Madness / Ramp Up / timed Side Quests as core loop** | Off-path or side path grind modes | **Out of scope** as product pillars (Side Quest *placement* on path is optional inspiration only) |
| **Owl / cast personality brand** | Characters cheer path and lessons | **Out of scope** (Peakelo has its own coach voice in `docs/design/ui.md`) |
| **Legendary as gold-economy prestige** | Hard mode + gold node + XP | Optional later; not required for path MVP |

Sources for existence (not endorsement):

- https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/
- https://blog.duolingo.com/time-spent-learning-well/
- https://blog.duolingo.com/ways-to-practice-in-duolingo/
- https://blog.duolingo.com/new-duolingo-home-screen-design/

---

## 6. Patterns worth stealing for Peakelo (structure only)

Mapped from Duolingo’s *learning-path* claims to chess coaching without copying brand chrome.

1. **One recommended next step** on a vertical path — remove “which drill folder?” anxiety the way Duolingo removed “which skill?” anxiety.  
   Source pattern: https://blog.duolingo.com/new-duolingo-home-screen-design/

2. **Units with human goal titles** (“stop hanging pieces,” not “Tactics 3”) + optional **guidebook** for explicit theory.  
   Source pattern: unit headers + guidebook in the same post.

3. **Sparse nodes; detail on tap** — path shows state (todo / current / done / locked); topic and start CTA live in a popup.  
   Source pattern: circle labels FAQ in redesign post; review/Legendary popup in ways-to-practice.

4. **Done ≠ dead** — completed nodes stay reachable for short review without leaving the map.  
   Source pattern: gold node review FAQs.

5. **Lock the future; allow tested jump-ahead** — default sequential unlock; escape hatch is a real placement check, not free skip.  
   Source pattern: locked unit + jump test FAQs / JUMP HERE help.

6. **Lesson = short sequence of single tasks**, easy recognition → harder production; small new-concept budget; help optional.  
   Source pattern: teaching method + difficulty + adaptive-lesson posts.

7. **Review is on the path**, not a guilt sidebar of broken skills.  
   Source pattern: practice built into path; cracked-skill problem called out in redesign.

8. **Prefer path-forward time** over side minigames when measuring “good learning.”  
   Source pattern: https://blog.duolingo.com/time-spent-learning-well/

---

## 7. Open gaps (honest limits of this research)

| Question | Status |
| --- | --- |
| Exact lock/grey styling of future nodes | Not specified in cited pages |
| Exercise count / progress-bar UX inside a lesson | Not specified |
| Full inventory of node icon types | Partial (Stories, Radio, Adventures, practice, chests mentioned in passing) |
| `support.duolingo.com` article dump | SPA; static fetch empty — use blog + indexed help FAQ |
| Chess course path specifics on Duolingo | Blog announces Chess course + bite-sized lessons (https://blog.duolingo.com/product-highlights/) but does **not** document a separate chess path IA in the pages read |

---

## 8. One-page cheat sheet

```
HOME (path)
  unit header (goal title) + guidebook entry
  nodes: locked | current | done(gold) | typed (story/practice/review/…)
  tap node → popup (topic + start/review/legendary/jump-test)
  scroll far → jump-to-current control
  open unit label → section list (past / now / later)

LESSON
  enter doing immediately
  one exercise after another
  easy forms → hard forms
  few new items
  optional hints
  optional adaptive harder tail
  exit → next path node (forward progress is the product)

DO NOT PORT
  XP · gems · hearts · streaks · Super/Max walls · leaderboard grind
```

---

*End of research notes. Update this file if Duolingo publishes a newer path IA post or if help-center articles become statically readable.*
