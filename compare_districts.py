
import pandas as pd
import geopandas as gpd

CSV_FILE = 'cleaned_crime_dataset_ready.csv'
GEOJSON_FILE = 'india.geojson'

# Load CSV
try:
    df = pd.read_csv(CSV_FILE)
    csv_districts = sorted(df['district'].unique().astype(str))
    print(f"CSV Districts: {len(csv_districts)}")
except Exception as e:
    print(f"Error loading CSV: {e}")
    csv_districts = []

# Load GeoJSON
try:
    gdf = gpd.read_file(GEOJSON_FILE)
    geo_districts = sorted(gdf['district'].unique().astype(str))
    print(f"GeoJSON Districts: {len(geo_districts)}")
except Exception as e:
    print(f"Error loading GeoJSON: {e}")
    geo_districts = []

# Check for 'Mumbai'
print("\n--- Mumbai Check ---")
print("CSV:", [d for d in csv_districts if 'mumbai' in d.lower()])
print("GeoJSON:", [d for d in geo_districts if 'mumbai' in d.lower()])

# Check for 'Navsari'
print("\n--- Navsari Check ---")
print("CSV:", [d for d in csv_districts if 'navsari' in d.lower()])
print("GeoJSON:", [d for d in geo_districts if 'navsari' in d.lower()])

# Check overlap
print("\n--- Overlap ---")
upper_csv = set([d.upper().strip() for d in csv_districts])
upper_geo = set([d.upper().strip() for d in geo_districts])
common = upper_csv.intersection(upper_geo)
print(f"Common Districts: {len(common)}")
print(f"In Geo but not CSV (first 5): {list(upper_geo - upper_csv)[:5]}")
print(f"In CSV but not Geo (first 5): {list(upper_csv - upper_geo)[:5]}")
