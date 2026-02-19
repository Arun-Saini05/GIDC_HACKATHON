
import geopandas as gpd

GEOJSON_FILE = 'india.geojson'

try:
    gdf = gpd.read_file(GEOJSON_FILE)
    print(f"Loaded {len(gdf)} features.")
    
    # Check Mumbai
    mumbai = gdf[gdf['district'].str.upper().str.strip() == 'MUMBAI']
    if not mumbai.empty:
        print("Mumbai found in GeoJSON.")
        is_valid = mumbai.geometry.is_valid.iloc[0]
        print(f"Is geometry valid? {is_valid}")
        
        if not is_valid:
            print("Attempting fix with buffer(0)...")
            fixed = mumbai.geometry.buffer(0).iloc[0]
            print(f"Is fixed geometry valid? {fixed.is_valid}")
    else:
        print("Mumbai NOT found in GeoJSON (filtered).")
        # Check raw names
        print("First 10 distinct districts:", gdf['district'].head(10).tolist())

except Exception as e:
    print(f"Error: {e}")
