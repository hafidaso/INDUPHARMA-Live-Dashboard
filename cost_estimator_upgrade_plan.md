# Upgrade: Cost Impact Estimator (Pharma-Grade Logic)

This plan implements a more realistic cost estimation model for INDUPHARMA, moving away from a flat "cost per minute" to a model that accounts for machine criticality and potential batch loss.

## User Review Required

> [!IMPORTANT]
> I will implement the following multipliers for machine criticality:
> - **CRITICAL (x5):** Autoclaves, Cold Rooms (High risk of batch loss).
> - **HIGH (x2):** Filling machines, Bioreactors.
> - **NORMAL (x1):** Packaging, Labeling, Conveyors.
>
> Is this weighting acceptable, or do you have specific MAD values for batch losses?

## Proposed Changes

### [App.tsx](file:///Users/hafida/Downloads/INDUPHARMA-Live-Dashboard-main/src/App.tsx)

#### [MODIFY] Update Cost Calculation Logic
- Replace the simple `downtime * costPerMinute` with a reducer that iterates over `data.kpiLogs`.
- For each log, determine the machine's criticality based on its name/type.
- Apply a multiplier to the downtime cost.
- **Add a "Batch Risk" penalty:** If a critical machine is currently `en_panne` (down), add a fixed one-time cost to the "Estimated Impact" to represent the material at risk.

#### [MODIFY] UI Enhancements
- Update the "Cost Impact Estimator" card to show a breakdown: "Base Downtime Cost" vs "Batch Risk & Quality Impact".
- Add a legend explaining the criticality multipliers.

## Verification Plan

### Automated Tests
- No automated tests available, manual validation required.

### Manual Verification
1. Log in as Admin.
2. Observe the "Cost Impact Estimator" in the "KPIs" tab.
3. Compare the impact of an "Autoclave" being down vs a "Packaging" machine.
4. Verify that the total MAD value reflects the new logic.
