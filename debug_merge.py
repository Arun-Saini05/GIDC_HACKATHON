
import pandas as pd
import geopandas as gpd

# Load Data
try:
    df = pd.read_csv('cleaned_crime_dataset_ready.csv')
    csv_districts = set(df['district'].astype(str).str.upper().str.strip())
    print(f"CSV Total Districts: {len(csv_districts)}")
    print(f"CSV Sample: {list(csv_districts)[:5]}")
except Exception as e:
    print(f"Error loading CSV: {e}")
    csv_districts = set()

try:
    gdf = gpd.read_file('india.geojson')
    geo_districts = set(gdf['district'].astype(str).str.upper().str.strip())
    print(f"GeoJSON Total Districts: {len(geo_districts)}")
    print(f"GeoJSON Sample: {list(geo_districts)[:5]}")
except Exception as e:
    print(f"Error loading GeoJSON: {e}")
    geo_districts = set()

# Check Merge
common = csv_districts.intersection(geo_districts)
only_csv = csv_districts - geo_districts
only_geo = geo_districts - csv_districts

print(f"\nCommon Districts: {len(common)}")
print(f"Only in CSV: {len(only_csv)}")
print(f"Only in GeoJSON: {len(only_geo)}")

print("\nSample matches:", list(common)[:5])
if len(only_csv) > 0:
    print("\nSample Missing in GeoJSON (from CSV):", list(only_csv)[:5])
if len(only_geo) > 0:
    print("\nSample Missing in CSV (from GeoJSON):", list(only_geo)[:5])
