# VINIX — Codex Development Rules

## 1. Project

VINIX is a dealership management system (DMS) for Auto Escandinavia.

The system manages:

- Vehicle stock
- Vehicle lifecycle
- Acquisitions
- Preparation
- Expenses
- Sales
- Profitability
- Documents
- Photos
- Activity/audit history
- Customers
- Warranty
- Future dealership automation

---

## 2. Technology Stack

Use the existing project stack.

- Next.js
- React
- TypeScript
- Prisma
- PostgreSQL
- Supabase
- Zod
- CSS already used by the project

Do not introduce new dependencies unless explicitly requested.

Follow the existing project structure and coding style.

---

## 3. Development Workflow

Work on ONE FEATURE SEGMENT at a time.

Before modifying code:

1. Inspect the relevant existing files.
2. Understand existing business logic.
3. Identify dependencies and related database models.
4. Make the smallest appropriate change.
5. Avoid unrelated refactoring.

After TypeScript changes:

```powershell
npx tsc --noEmit
```

Run relevant tests or validation when available.

Do not declare a task complete until the implementation has been checked.

---

## 4. Important Safety Rules

VINIX uses a real PostgreSQL/Supabase database.

NEVER run destructive database commands unless explicitly instructed.

Never run:

```powershell
npx prisma migrate reset
```

Never run:

```powershell
npx prisma db push --force-reset
```

Never drop tables.

Never delete production data.

Never run:

```powershell
npx prisma db pull
```

unless explicitly instructed.

Do not modify the database directly unless the task explicitly requires it and the change has been approved.

Do not invent database fields that do not exist in the Prisma schema.

Before making database changes, inspect:

```text
prisma/schema.prisma
```

---

## 5. Prisma Rules

Prisma schema is a critical source of truth.

When modifying Prisma models:

1. Inspect the existing model.
2. Preserve existing relations.
3. Preserve existing indexes and constraints.
4. Do not remove fields without explicit instruction.
5. Do not overwrite schema changes from previous feature segments.
6. Regenerate Prisma Client after schema changes:

```powershell
npx prisma generate
```

Then run:

```powershell
npx tsc --noEmit
```

VINIX currently has an existing database without a complete Prisma migration history.

Do NOT attempt to fix migration history automatically.

Do NOT reset the database.

If migration/baseline work is required, stop and report the situation before making changes.

---

## 6. Vehicle Lifecycle

The primary vehicle lifecycle is:

```text
PURCHASED
    ↓
IN_PREPARATION
    ↓
READY_FOR_SALE → SOLD
    ↓
RESERVED
    ↓
SOLD
```

Additional statuses:

```text
HOLD
CANCELLED
```

Status transitions must respect business logic.

Do not allow arbitrary lifecycle transitions simply because the database enum permits them.

When implementing lifecycle changes, inspect the existing transition logic first.

---

## 7. Acquisition Rules

Every vehicle may have one acquisition record.

Acquisition contains:

* Supplier
* Auction house
* Invoice number
* Invoice date
* Purchase price
* Auction fee
* Transport cost
* Tax cost
* Other cost
* Currency
* Approval timestamp

Acquisition workflow:

```text
Create acquisition
        ↓
ACQUISITION_CREATED
        ↓
Pending approval
        ↓
Approve acquisition
        ↓
approvedAt
        ↓
ACQUISITION_APPROVED
```

Creating an acquisition must NOT automatically approve it.

An acquisition can only be approved once.

Do not create duplicate acquisition records.

---

## 8. Preparation Rules

Preparation represents the work required to make a purchased vehicle ready for sale.

Typical lifecycle:

```text
PURCHASED
    ↓
IN_PREPARATION
    ↓
READY_FOR_SALE
```

Preparation costs are represented through expenses.

Do not duplicate financial values unnecessarily.

---

## 9. Expense Rules

Expenses belong to a vehicle.

Expense categories include:

* MECHANICAL
* PARTS
* TYRES
* BODYWORK
* PAINT
* DETAILING
* ITV
* GESTORIA
* REGISTRATION
* TRANSPORT
* WARRANTY
* OTHER

Expense totals contribute to the vehicle's true cost.

Current financial concept:

```text
Acquisition Cost
+
Vehicle Expenses
=
True Vehicle Cost
```

Do not create separate competing calculations for the same concept.

Use the existing functions in:

```text
lib/calculations.ts
```

when applicable.

---

## 10. Sale Rules

A vehicle can only be sold from `READY_FOR_SALE` or `RESERVED`:

```text
READY_FOR_SALE → SOLD
READY_FOR_SALE → RESERVED → SOLD
```

A vehicle must have:

* An acquisition record
* An approved acquisition
* A valid sale record

A vehicle may only have one sale record.

The sale process must atomically perform:

```text
Create Sale
      +
Change Vehicle status to SOLD
      +
Create VEHICLE_SOLD event
```

If any operation fails, the entire operation must fail.

Use a Prisma transaction for this.

Never leave the database in a state where:

```text
Sale exists
but Vehicle is not SOLD
```

or:

```text
Vehicle is SOLD
but Sale does not exist
```

---

## 11. Financial Calculations

VINIX must distinguish between:

### Acquisition Cost

```text
Purchase Price
+ Auction Fee
+ Transport
+ Tax
+ Other Acquisition Costs
```

### True Vehicle Cost

```text
Acquisition Cost
+ Vehicle Expenses
```

### Gross Profit

```text
Sale Price
- True Vehicle Cost
```

### Gross Margin

```text
Gross Profit / Sale Price
```

### ROI

```text
Gross Profit / True Vehicle Cost
```

Use existing calculation utilities whenever possible.

Do not duplicate financial formulas across components.

Financial correctness has higher priority than UI convenience.

---

## 12. Activity / Audit Trail

Important business actions should create VehicleEvent records.

Examples:

```text
VEHICLE_CREATED
ACQUISITION_CREATED
ACQUISITION_APPROVED
EXPENSE_ADDED
STATUS_CHANGED
VEHICLE_RESERVED
VEHICLE_SOLD
DOCUMENT_UPLOADED
```

Use the existing VehicleEvent model and enum.

Do not invent new event types without checking:

```text
prisma/schema.prisma
```

If a required event type does not exist, report it before modifying the enum.

---

## 13. API Rules

Existing API routes are under:

```text
app/api/
```

Use:

* NextResponse
* Prisma through the existing db client
* Zod validation where appropriate
* Existing error-response patterns

Validate:

* Resource existence
* Duplicate records
* Business rules
* Input types
* Invalid state transitions

Do not trust frontend validation alone.

Business rules must be enforced server-side.

---

## 14. Frontend Rules

Use the existing UI architecture.

Do not introduce a new UI framework.

Maintain:

* Existing class names
* Existing visual language
* Existing responsive behavior
* Existing components where applicable

Avoid unnecessary redesigns while implementing business functionality.

When adding a UI feature:

1. Make the data model/API work.
2. Connect the UI.
3. Validate the workflow.
4. Then improve visual polish.

---

## 15. TypeScript Rules

Maintain strict TypeScript correctness.

Never solve TypeScript errors by using:

```ts
any
```

unless explicitly justified.

Prefer proper types.

After relevant changes run:

```powershell
npx tsc --noEmit
```

Do not leave known TypeScript errors unresolved.

---

## 16. Git Rules

Do NOT automatically:

```powershell
git commit
```

or:

```powershell
git push
```

unless explicitly instructed.

Before committing, provide:

* Changed files
* Summary of changes
* Validation performed
* Any known risks

Never rewrite history.

Never amend existing commits unless explicitly requested.

---

## 17. Scope Control

Do not modify unrelated files.

If solving a problem requires changes outside the requested feature:

1. Explain why.
2. Identify the affected files.
3. Make only necessary changes.

Do not perform broad refactoring during feature implementation.

---

## 18. Existing Business Logic Has Priority

Before implementing new functionality:

Search the repository for existing implementations.

Look for:

* Existing API routes
* Existing calculations
* Existing status transitions
* Existing validation
* Existing components
* Existing database relationships
* Existing event types

Extend existing logic instead of creating duplicate systems.

---

## 19. Database Safety

When a database operation is potentially destructive or irreversible:

STOP.

Explain:

* What will change
* What data could be affected
* Whether the operation is reversible
* What backup/rollback strategy exists

Wait for explicit confirmation before proceeding.

---

## 20. Completion Standard

A feature segment is considered complete only when:

* Implementation is complete
* Business rules are enforced server-side
* TypeScript passes
* Relevant workflow has been tested
* No unrelated functionality was broken
* Changed files are clearly reported

Report completion using:

```text
Feature:
Status:

Files changed:
- ...

Validation:
- ...

Tests:
- ...

Known issues:
- ...

Recommended next segment:
- ...
```

---

## 21. Current VINIX Priority

Prioritize development in approximately this order:

1. Sale workflow
2. Prisma migration/baseline architecture
3. Financial correctness
4. Documents
5. Authentication and permissions
6. Customer/CRM
7. Warranty
8. Stock ageing
9. Management dashboard
10. Photos
11. Integrations
12. Advanced automation
13. UI polish

Do not jump ahead to integrations or advanced automation while core dealership workflows remain incomplete.

---

## 22. Agent Behavior

Act as a senior software engineer working inside an existing production-oriented codebase.

Be conservative with changes.

Inspect before editing.

Prefer simple, maintainable solutions.

Preserve existing functionality.

Do not guess when the repository can answer the question.

If requirements conflict with existing code or database structure:

STOP and explain the conflict.

Never silently choose a potentially destructive solution.
