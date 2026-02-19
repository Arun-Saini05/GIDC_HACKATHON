
import pandas as pd
import geopandas as gpd
import numpy as np
import json
import os
import datetime

# --- Configuration ---
DATA_FILE = 'cleaned_crime_dataset_ready.csv'
GEOJSON_FILE = 'india.geojson'
EXPORT_DIR = 'backend/data'

# Ensure export directory exists
os.makedirs(EXPORT_DIR, exist_ok=True)

def load_and_process_data():
    print("Loading data...")
    try:
        df = pd.read_csv(DATA_FILE)
    except FileNotFoundError:
        print(f"Error: {DATA_FILE} not found. Please ensure the file is in the directory.")
        return

    # 1. WCI Calculation
    print("Calculating WCI...")
    crime_severity_weights = {
        'Heinous': 1.0, 'Serious': 0.7, 'Property': 0.4, 'Others': 0.2
    }
    
    # Define crime categories (matching CSV columns)
    all_columns = df.columns.tolist()
    
    heinous_crimes = ['murder', 'rape', 'dacoity', 'kidnapping_and_abduction', 'dowry_deaths', 'acid_attack', 'human_trafficking', 'protection_of_children_from_sexual_offences_act']
    serious_crimes = ['attempt_to_commit_murder', 'culpable_homicide_not_amounting_to_murder', 'attempt_to_commit_culpable_homicide', 'robbery', 'arson', 'riots', 'extortion', 'cyber_crimes', 'crimes_against_children', 'assault_on_women_with_intent_to_outrage_her_modesty', 'sexual_harassment', 'stalking', 'cruelty_by_husband_or_his_relatives', 'narcotic_drugs_and_psychotropic_substances_act', 'arms_act', 'explosives_act', 'immoral_traffic_prevention_act', 'scheduled_castes_and_scheduled_tribes_prevention_of_atrocities_act', 'prevention_of_corruption_act', 'offences_against_state']
    property_crimes = ['burglary', 'theft', 'auto_theft', 'other_theft', 'criminal_breach_of_trust', 'cheating', 'counterfeiting', 'money_laundering_act', 'destruction_of_public_property_act', 'copyright_act', 'trademarks_act']
    other_crimes = ['hurt', 'public_nuisance', 'gambling_act', 'excise_act', 'wildlife_protection_act', 'foreigners_act', 'food_safety_and_standards_act', 'drugs_and_cosmetics_act', 'environment_protection_act', 'forest_act', 'indian_forest_act', 'mines_and_minerals_regulation_of_development_act', 'motor_vehicles_act_1988', 'prevention_of_food_adulteration_act', 'railway_act', 'registration_act', 'ancient_monuments_and_archaeological_sites_and_remains_act', 'atomic_energy_act', 'cinematograph_act', 'customs_act', 'electricity_act', 'emigration_act', 'essential_commodities_act', 'explosive_substances_act', 'indecent_representation_of_women_prohibition_act', 'indian_penal_code', 'information_technology_act', 'juvenile_justice_care_and_protection_of_children_act', 'legal_services_authorities_act', 'lokayukta_act', 'medical_council_act', 'minimum_wages_act', 'national_security_act', 'passport_act', 'petroleum_act', 'prevention_of_blackmarketing_and_maintenance_of_supplies_of_essential_commodities_act', 'prevention_of_damage_to_public_property_act', 'protection_of_women_from_domestic_violence_act', 'public_gambling_act', 'registration_of_births_and_deaths_act', 'right_to_information_act', 'sexual_harassment_of_women_at_workplace_prevention_prohibition_and_redressal_act', 'specific_relief_act', 'stamp_act', 'tea_act', 'tobacco_act', 'transplantation_of_human_organ', 'mental_health_act', 'motor_vehicle_act', 'city_town_police_acts', 'other_state_local_acts', 'other_sll_crimes', 'transgender_persons_protection_of_rights_act', 'unlawful_assembly', 'offences_affecting_public_health_safety_decency_and_morals', 'offences_relating_to_documents_and_property_marks', 'offences_relating_to_marriages', 'offences_by_public_servants', 'juvenile_in_conflict_with_law']
    
    # Filter only columns that exist
    heinous_crimes = [c for c in heinous_crimes if c in all_columns]
    serious_crimes = [c for c in serious_crimes if c in all_columns]
    property_crimes = [c for c in property_crimes if c in all_columns]
    other_crimes = [c for c in other_crimes if c in all_columns]
    
    # Calculate WCI
    df['Heinous_WCI'] = df[heinous_crimes].sum(axis=1) * crime_severity_weights['Heinous']
    df['Serious_WCI'] = df[serious_crimes].sum(axis=1) * crime_severity_weights['Serious']
    df['Property_WCI'] = df[property_crimes].sum(axis=1) * crime_severity_weights['Property']
    df['Others_WCI'] = df[other_crimes].sum(axis=1) * crime_severity_weights['Others']
    
    df['WCI'] = df['Heinous_WCI'] + df['Serious_WCI'] + df['Property_WCI'] + df['Others_WCI']
    
    # Standardize District Names
    df['district_std'] = df['district'].str.upper().str.strip()

    # 2. Trend Analysis (Future Increase Chance)
    print("Analyzing Trends...")
    # Pivot to get WCI by Year for each district
    pivot_wci = df.pivot_table(index='district_std', columns='year', values='WCI', aggfunc='mean')
    
    # Get sorted years
    years = sorted(pivot_wci.columns)
    latest_year = years[-1]
    prev_year = years[-2] if len(years) > 1 else latest_year
    
    trend_map = {}
    for district in pivot_wci.index:
        current_val = pivot_wci.loc[district, latest_year]
        prev_val = pivot_wci.loc[district, prev_year]
        
        if prev_val > 0:
            change = ((current_val - prev_val) / prev_val) * 100
        else:
            change = 0.0 # No data or 0 base
            
        trend_map[district] = change

    # 3. Hotspot Classification (on Latest Data)
    print(f"Latest Year: {latest_year}")
    df_latest = df[df['year'] == latest_year].copy()
    print(f"Latest Data Rows: {len(df_latest)}")
    
    # Check Mumbai in df_latest
    mumbai_data = df_latest[df_latest['district_std'] == 'MUMBAI']
    if not mumbai_data.empty:
        print("Mumbai data found in latest year:")
        print(mumbai_data[['district_std', 'WCI']].to_dict('records'))
    else:
        print("Mumbai data NOT found in latest year.")
    
    # Group by district in case of duplicates in latest year (shouldn't happen but safe)
    df_latest = df_latest.groupby('district_std').agg({
        'WCI': 'mean',
        'Heinous_WCI': 'mean',
        'Serious_WCI': 'mean',
        'Property_WCI': 'mean',
        'Others_WCI': 'mean'
    }).reset_index()

    percentile_80 = df_latest['WCI'].quantile(0.80)
    percentile_40 = df_latest['WCI'].quantile(0.40)
    
    def classify(wci):
        if wci > percentile_80: return 'High'
        elif wci > percentile_40: return 'Medium'
        return 'Low'
    
    df_latest['Hotspot_Category'] = df_latest['WCI'].apply(classify)
    
    # Add Trend and Date
    df_latest['Future_Increase_Chance'] = df_latest['district_std'].map(trend_map).fillna(0).apply(lambda x: f"{x:.1f}%")
    df_latest['Analysis_Date'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 4. Geo Preparation
    print("Loading GeoJSON...")
    if not os.path.exists(GEOJSON_FILE):
        print(f"Error: {GEOJSON_FILE} not found.")
        return

    india_gdf = gpd.read_file(GEOJSON_FILE)
    
    # Filter out null districts (Likely state boundaries)
    initial_count = len(india_gdf)
    india_gdf = india_gdf[india_gdf['district'].notna()]
    print(f"Filtered {initial_count - len(india_gdf)} null district features.")
    
    india_gdf['district_std'] = india_gdf['district'].str.upper().str.strip()
    
    # Merge
    # Drop 'district' from df_latest if it exists to avoid district_x/district_y
    if 'district' in df_latest.columns:
        df_latest = df_latest.drop(columns=['district'])

    gdf_final = india_gdf.merge(df_latest, on='district_std', how='left')
    
    print(f"Merged Columns: {gdf_final.columns.tolist()}")
    
    # Fill NA for visualization
    gdf_final['WCI'] = gdf_final['WCI'].fillna(0)
    gdf_final['Hotspot_Category'] = gdf_final['Hotspot_Category'].fillna('No Data')
    gdf_final['Future_Increase_Chance'] = gdf_final['Future_Increase_Chance'].fillna('N/A')
    gdf_final['Analysis_Date'] = gdf_final['Analysis_Date'].fillna(datetime.datetime.now().strftime("%Y-%m-%d"))

    # 5. Graph Construction
    print("Building Spatial Graph...")
    adj_list = {}
    
    # Filter valid geometries
    valid_gdf = gdf_final[gdf_final.geometry.is_valid] 
    
    # Optimization: Use spatial index
    sindex = valid_gdf.sindex
    
    for idx, row in valid_gdf.iterrows():
        district = row['district_std']
        # If district name is missing or empty, skip
        if not district or pd.isna(district): continue
            
        # Find neighbors using spatial index
        possible_matches_index = list(sindex.intersection(row.geometry.bounds))
        possible_matches = valid_gdf.iloc[possible_matches_index]
        neighbors = possible_matches[possible_matches.geometry.touches(row.geometry)]
        
        edges = []
        for _, neighbor_row in neighbors.iterrows():
            neighbor_name = neighbor_row['district_std']
            if neighbor_name == district: continue # Skip self
            if not neighbor_name or pd.isna(neighbor_name): continue
            
            # Distance
            dist = row.geometry.centroid.distance(neighbor_row.geometry.centroid)
            
            # Risk
            risk = neighbor_row['WCI']
            
            # Weight formula - Threshold-based non-linear penalty
            # Goal: Strictly avoid RED (High), tolerate ORANGE (Medium) if short, prefer GREEN (Low)
            
            target_category = neighbor_row['Hotspot_Category']
            
            if target_category == 'High':
                penalty_multiplier = 10.0 # Heavy penalty: 1km -> 10km effective
            elif target_category == 'Medium':
                penalty_multiplier = 2.0 # Mild penalty: 1km -> 2km effective
            else: # Low or No Data
                penalty_multiplier = 1.0 # No extra penalty: 1km -> 1km effective
                
            # Base weight is distance * multiplier
            # We also add a small linear factor of risk to differentiate within categories
            # weight = dist * (penalty_multiplier + (risk * 0.1)) 
            weight = dist * penalty_multiplier

            edges.append({
                'target': neighbor_name,
                'weight': weight,
                'distance': dist,
                'risk': risk,
                'category': target_category
            })
        
        adj_list[district] = edges

    # 6. Export
    output_geojson = os.path.join(EXPORT_DIR, 'crime_data_v2.geojson')
    gdf_final.to_file(output_geojson, driver='GeoJSON')
    print(f"Exported processed data to {output_geojson}")
    
    # Validation
    print("Validating V2 Export...")
    v2_check = gpd.read_file(output_geojson)
    valid_count = v2_check['Hotspot_Category'].notna().sum()
    print(f"Features with valid Hotspot_Category: {valid_count} / {len(v2_check)}")
    
    output_graph = os.path.join(EXPORT_DIR, 'district_graph.json')
    with open(output_graph, 'w') as f:
        json.dump(adj_list, f, indent=2)
    print(f"Exported graph data to {output_graph}")

if __name__ == "__main__":
    load_and_process_data()
