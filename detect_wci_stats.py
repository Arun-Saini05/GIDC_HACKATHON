import pandas as pd

df = pd.read_csv('cleaned_crime_dataset_ready.csv')

# Calculate WCI if not present (simplified version of process_and_export.py logic for quick check)
# Actually, let's just use the logic from process_and_export.py to be sure
# But wait, looking at process_and_export.py, WCI is calculated on the fly.
# Let's simple read the CSV and do a quick calc to see the range.

crime_severity_weights = {
    'Heinous': 1.0, 'Serious': 0.7, 'Property': 0.4, 'Others': 0.2
}

# We need to know which columns are which, but I can approximate or just look at the columns in the CSV.
# Better yet, let's just import the function if possible, or copy-paste the minimal logic.

# Let's just mock the columns based on the file inspection I did earlier? 
# No, I didn't verify the columns. Let's just print the head and columns first.

print("Columns:", df.columns.tolist())
# I will refine this script after seeing the columns in the next turn if needed, 
# but I can probably guess the WCI calculation from the previous view_file of process_and_export.py

# ... actually, I'll just write a script that imports 'process_and_export' if it was a module,
# but it's a script.

# Let's write a fresh script that replicates the logic exactly to see the values.
# I'll copy the lists from process_and_export.py

heinous_crimes = ['murder', 'rape', 'dacoity', 'kidnapping_and_abduction', 'dowry_deaths', 'acid_attack', 'human_trafficking', 'protection_of_children_from_sexual_offences_act']
serious_crimes = ['attempt_to_commit_murder', 'culpable_homicide_not_amounting_to_murder', 'attempt_to_commit_culpable_homicide', 'robbery', 'arson', 'riots', 'extortion', 'cyber_crimes', 'crimes_against_children', 'assault_on_women_with_intent_to_outrage_her_modesty', 'sexual_harassment', 'stalking', 'cruelty_by_husband_or_his_relatives', 'narcotic_drugs_and_psychotropic_substances_act', 'arms_act', 'explosives_act', 'immoral_traffic_prevention_act', 'scheduled_castes_and_scheduled_tribes_prevention_of_atrocities_act', 'prevention_of_corruption_act', 'offences_against_state']
property_crimes = ['burglary', 'theft', 'auto_theft', 'other_theft', 'criminal_breach_of_trust', 'cheating', 'counterfeiting', 'money_laundering_act', 'destruction_of_public_property_act', 'copyright_act', 'trademarks_act']
other_crimes = ['hurt', 'public_nuisance', 'gambling_act', 'excise_act', 'wildlife_protection_act', 'foreigners_act', 'food_safety_and_standards_act', 'drugs_and_cosmetics_act', 'environment_protection_act', 'forest_act', 'indian_forest_act', 'mines_and_minerals_regulation_of_development_act', 'motor_vehicles_act_1988', 'prevention_of_food_adulteration_act', 'railway_act', 'registration_act', 'ancient_monuments_and_archaeological_sites_and_remains_act', 'atomic_energy_act', 'cinematograph_act', 'customs_act', 'electricity_act', 'emigration_act', 'essential_commodities_act', 'explosive_substances_act', 'indecent_representation_of_women_prohibition_act', 'indian_penal_code', 'information_technology_act', 'juvenile_justice_care_and_protection_of_children_act', 'legal_services_authorities_act', 'lokayukta_act', 'medical_council_act', 'minimum_wages_act', 'national_security_act', 'passport_act', 'petroleum_act', 'prevention_of_blackmarketing_and_maintenance_of_supplies_of_essential_commodities_act', 'prevention_of_damage_to_public_property_act', 'protection_of_women_from_domestic_violence_act', 'public_gambling_act', 'registration_of_births_and_deaths_act', 'right_to_information_act', 'sexual_harassment_of_women_at_workplace_prevention_prohibition_and_redressal_act', 'specific_relief_act', 'stamp_act', 'tea_act', 'tobacco_act', 'transplantation_of_human_organ', 'mental_health_act', 'motor_vehicle_act', 'city_town_police_acts', 'other_state_local_acts', 'other_sll_crimes', 'transgender_persons_protection_of_rights_act', 'unlawful_assembly', 'offences_affecting_public_health_safety_decency_and_morals', 'offences_relating_to_documents_and_property_marks', 'offences_relating_to_marriages', 'offences_by_public_servants', 'juvenile_in_conflict_with_law']

# Filter only columns that exist
all_columns = df.columns.tolist()
heinous_crimes = [c for c in heinous_crimes if c in all_columns]
serious_crimes = [c for c in serious_crimes if c in all_columns]
property_crimes = [c for c in property_crimes if c in all_columns]
other_crimes = [c for c in other_crimes if c in all_columns]

df['Heinous_WCI'] = df[heinous_crimes].sum(axis=1) * crime_severity_weights['Heinous']
df['Serious_WCI'] = df[serious_crimes].sum(axis=1) * crime_severity_weights['Serious']
df['Property_WCI'] = df[property_crimes].sum(axis=1) * crime_severity_weights['Property']
df['Others_WCI'] = df[other_crimes].sum(axis=1) * crime_severity_weights['Others']
df['WCI'] = df['Heinous_WCI'] + df['Serious_WCI'] + df['Property_WCI'] + df['Others_WCI']

print("WCI Stats:")
print(df['WCI'].describe())

print("\nTop 10 High Risk Districts:")
print(df.sort_values(by='WCI', ascending=False)[['district', 'WCI']].head(10))

print("\nAhmednagar WCI:")
print(df[df['district'].str.contains('Ahmednagar', case=False, na=False)][['district', 'WCI']])
