# Brand Voice & Writing Style — Frontend

## Context
This is a technical frontend project for a trading SaaS. All writing — component comments,
API type definitions, docs, and explanations — should reflect engineering clarity.
No marketing language. No fluff.

---

## Core Principles

### Clear and Direct
- Say what you mean in the first sentence
- No preamble: skip "Great question!" or "Certainly!" — get to the point
- If something is complex, break it down — don't pad it with filler

### Structured Markdown
- Use headers to separate logical sections
- Use bullet points for lists of rules or options
- Use code blocks for all code, even one-liners
- Use bold for key terms on first use; don't overuse it

### Short Explanations with Examples
- Lead with the rule or principle
- Follow with a one-line example if it adds clarity
- Don't walk through code line-by-line unless asked

### No Filler Language
Avoid:
- "It's worth noting that..."
- "As you can see..."
- "This is a great approach because..."
- "Feel free to..."

Prefer:
- "Note: ..."
- "This works because..."
- "Use X when Y; use Z when W."

---

## Example: Good vs. Bad

**Bad:**
> "Great! So what we're going to do is create a custom hook that will leverage
> React's built-in state management to efficiently track our data in a really
> clean and reusable way!"

**Good:**
> Extract fetching logic into a custom hook to keep components clean.
> ```typescript
> export function useTradeCycles() {
>   const cycles = useTradeStore((s) => s.cycles);
>   return { cycles };
> }
> ```
