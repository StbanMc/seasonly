<!--
Thanks for sending a pull request. Please fill in the sections below — the
checklist exists so reviewers can focus on the change itself instead of
the basics.
-->

## What does this change?

<!-- One short paragraph. What is different after this PR lands? -->

## Why?

<!-- The motivation. Linked issue if any. If this is a calendar PR, cite
your sources for any non-obvious holiday dates here. -->

## How to verify

<!-- A list of steps so the reviewer can reproduce. For UI changes, name
the example page (examples/01-..., index.html, etc.) and what to look at. -->

## Checklist

- [ ] `npm test` is green
- [ ] `npm run size` stays under the budget
- [ ] `npm run verify:zero-deps` is green (zero runtime AND dev deps)
- [ ] If this touches a Web Component, I opened the relevant
      `examples/*.html` page in `npm run dev` and verified the change
      visually.
- [ ] If this affects accessibility, I tested with system "Reduce
      motion" toggled both on and off.
- [ ] If this adds a new calendar, I cited primary sources for moving
      holidays in the description above.
- [ ] If this adds a new particle effect, I updated
      `src/core/schema-validator.js` so calendars can name it.
- [ ] My commits are written in first person; I have not included AI
      attributions, generator footers, or assistant signatures in
      commit messages, PR descriptions, or code comments.
- [ ] I agree my contribution is licensed under MIT.
