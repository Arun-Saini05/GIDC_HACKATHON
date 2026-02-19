
import geopandas as gpd

try:
    print("Loading india.geojson...")
    gdf = gpd.read_file('india.geojson')
    print(f"Total Features: {len(gdf)}")
    
    # Check for null districts
    null_districts = gdf[gdf['district'].isna()]
    print(f"Features with null 'district': {len(null_districts)}")
    
    if len(null_districts) > 0:
        print("\nSample null district features:")
        print(null_districts[['dt_code', 'st_nm', 'district']].head())
        
    # Check for 'Rajasthan' specifically
    rajasthan = gdf[gdf['st_nm'] == 'Rajasthan']
    print(f"\nFeatures in Rajasthan state: {len(rajasthan)}")
    null_raj = rajasthan[rajasthan['district'].isna()]
    print(f"Rajasthan features with null district: {len(null_raj)}")

except Exception as e:
    print(f"Error: {e}")
