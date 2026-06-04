# Project Plan — MissIssippi AI Inventory Search

## Goal
Build an AI-powered inventory search tool for an apparel wholesale system.

## Current Scope
Inventory only. Customers, orders, and sales are out of scope.

---

## Steps

### Step 1 — Inventory Analysis ✅
Analyzed all models, entities, and database tables related to products, SKUs, colours, sizes, seasons, inventory quantities, and pricing. Identified weak and missing areas in the current design.

### Step 2 — Backend Function Design ✅
Designed V1 backend function contracts for inventory search:
- SearchInventory
- GetProductDetails
- CheckAvailability
- GetLowStockItems
- SearchByStyleNumber
- SearchByColor
- SearchBySeason
- GetInventoryActivityForVariant

Clearly marked functions excluded due to missing schema support.

### Step 3 — Implement SearchInventory and CheckAvailability ⬅ CURRENT
Implement the first two backend search functions as read-only API endpoints.

### Step 4 — Expand Backend Functions
Implement remaining V1 functions from the Step 2 contracts.
