# Auto Note Mover - Examples

This file contains examples of how tags are used to organize notes.

## Basic Examples

### Example 1: Single Tag
```markdown
# Project Ideas
#projects

Content here...
```
**Result**: Note moves to `projects/Project Ideas.md`

### Example 2: Nested Tags (Parent/Child)
```markdown
# Client Meeting Notes
#meetings/clients

Content here...
```
**Result**: Note moves to `meetings/clients/Client Meeting Notes.md`

### Example 3: Deep Hierarchy
```markdown
# Q1 Budget Report
#work/finance/reports/2024

Content here...
```
**Result**: Note moves to `work/finance/reports/2024/Q1 Budget Report.md`

## Advanced Examples

### Example 4: Multiple Tags (Deepest Wins)
```markdown
# Important Document
#work
#work/projects
#work/projects/client-a

Content here...
```
**Result**: Note moves to `work/projects/client-a/Important Document.md`
(The deepest tag hierarchy is used)

### Example 5: Frontmatter Tags
```markdown
---
tags: [projects, work/active]
---

# My Note

Content here...
```
**Result**: Note moves to `work/active/My Note.md`
(Frontmatter tags are also recognized)

### Example 6: Mixed Tag Formats
```markdown
---
tags:
  - personal
  - hobbies/photography
---

# Camera Settings Guide

I also like #photography/tutorials

Content here...
```
**Result**: Note moves to `hobbies/photography/Camera Settings Guide.md`
(All tag formats are combined, deepest hierarchy wins)

## Use Cases

### Use Case 1: Project Management
```markdown
# Sprint Planning
#projects/work/sprint-2024-01

- Task 1
- Task 2
```
Organizes into: `projects/work/sprint-2024-01/`

### Use Case 2: Knowledge Base
```markdown
# Python Decorators
#programming/python/advanced

Explanation of decorators...
```
Organizes into: `programming/python/advanced/`

### Use Case 3: Personal Notes
```markdown
# Book Notes: Atomic Habits
#reading/non-fiction/self-improvement

Key takeaways...
```
Organizes into: `reading/non-fiction/self-improvement/`

### Use Case 4: Meeting Notes
```markdown
# Team Standup 2024-01-15
#meetings/daily/team-alpha

Attendees:
- Alice
- Bob
```
Organizes into: `meetings/daily/team-alpha/`

## Tips

1. **Consistent Naming**: Use consistent tag names (e.g., always `#work` not `#Work`)
2. **Hierarchy Planning**: Plan your tag hierarchy before tagging many notes
3. **Tag Reuse**: Reuse tags across notes to build a coherent structure
4. **Preview First**: Use the "Preview move" command to see where a note will go
5. **Excluded Folders**: Add template or archive folders to the excluded list in settings

## Common Patterns

### Pattern 1: Area/Category/Topic
```
#area/category/topic
Example: #work/marketing/campaigns
```

### Pattern 2: Type/Project/Phase
```
#type/project/phase
Example: #notes/project-x/planning
```

### Pattern 3: Domain/Subdomain/Specific
```
#domain/subdomain/specific
Example: #science/physics/quantum-mechanics
```

### Pattern 4: Time-based Organization
```
#category/year/quarter
Example: #reports/2024/q1
```

