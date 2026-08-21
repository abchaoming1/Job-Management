from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd


def main() -> None:
    source = Path(sys.argv[1])
    workbook = pd.ExcelFile(source)
    frame = pd.read_excel(source, sheet_name=workbook.sheet_names[0], usecols="A:H")
    frame.columns = ["period", "year", "month", "channel", "sku", "model", "qty", "revenue"]
    frame = frame[frame["channel"].astype(str).str.strip().eq("MC")].copy()
    frame["period"] = pd.to_numeric(frame["period"], errors="coerce").astype("Int64")
    frame["year"] = pd.to_numeric(frame["year"], errors="coerce").astype("Int64")
    frame["month"] = pd.to_numeric(frame["month"], errors="coerce").astype("Int64")
    frame["qty"] = pd.to_numeric(frame["qty"], errors="coerce").fillna(0)
    frame["revenue"] = pd.to_numeric(frame["revenue"], errors="coerce").fillna(0)
    frame = frame.dropna(subset=["period", "year", "month", "sku"])
    inferred_model = frame["sku"].astype(str).str.split("-").str[0]
    inferred_model = inferred_model.replace({"S821": "S820"})
    frame["model"] = frame["model"].fillna(inferred_model)

    monthly = (
        frame.groupby(["period", "year", "month"], as_index=False)[["qty", "revenue"]]
        .sum()
        .sort_values(["year", "month"])
    )
    yearly = frame.groupby("year", as_index=False)[["qty", "revenue"]].sum().sort_values("year")
    latest_year = int(monthly["year"].max())
    latest_month = int(monthly.loc[monthly["year"].eq(latest_year), "month"].max())
    latest_period = int(
        monthly.loc[
            monthly["year"].eq(latest_year) & monthly["month"].eq(latest_month), "period"
        ].iloc[0]
    )
    latest = frame[frame["year"].eq(latest_year) & frame["month"].eq(latest_month)]
    latest_skus = (
        latest.groupby(["sku", "model"], as_index=False)[["qty", "revenue"]]
        .sum()
        .sort_values(["revenue", "qty"], ascending=False)
    )

    records = (
        frame[["year", "month", "sku", "model", "qty", "revenue"]]
        .sort_values(["year", "month", "model", "sku"])
        .to_dict("records")
    )
    payload = {
        "sheet_names": workbook.sheet_names,
        "rows": int(len(frame)),
        "period_min": int(monthly["period"].min()),
        "period_max": latest_period,
        "monthly": monthly.to_dict("records"),
        "yearly": yearly.to_dict("records"),
        "latest_skus": latest_skus.to_dict("records"),
        "skus": sorted(frame["sku"].astype(str).unique().tolist()),
        "models": sorted(frame["model"].astype(str).unique().tolist()),
        "records": records,
    }
    serialized = json.dumps(payload, ensure_ascii=False, indent=2)
    if len(sys.argv) > 2:
        destination = Path(sys.argv[2])
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(f"window.MC_DATA = {serialized};\n", encoding="utf-8")
        print(destination)
    else:
        print(serialized)


if __name__ == "__main__":
    main()
