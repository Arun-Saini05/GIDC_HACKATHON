
import json
import os
from datetime import datetime

notebook_path = r'c:/Users/aruns/OneDrive/Desktop/Crime Prediction/Crime_Detection_Model.ipynb'

def update_notebook():
    try:
        with open(notebook_path, 'r', encoding='utf-8') as f:
            nb = json.load(f)
        
        # 1. Update the Prediction Logic Cell
        # We look for the cell that contains "Predicted Future Hotspots Threshold"
        prediction_cell_found = False
        for cell in nb['cells']:
            if cell['cell_type'] == 'code':
                source_text = ''.join(cell['source'])
                if "predicted_hotspot_threshold =" in source_text and "gdf_predicted_state['Predicted_Future_Hotspot_LSTM'] =" in source_text:
                    print("Found Prediction Logic Cell.")
                    
                    # We want to append our new logic at the end of this cell
                    # The original cell ends with printing/displaying and setting predicted_year
                    
                    new_code_snippet = [
                        "\n",
                        "    # --- NEW: Calculate Future Increase Chance and Add Current Time ---\n",
                        "    from datetime import datetime\n",
                        "\n",
                        "    # Get the latest historical WCI for each district\n",
                        "    # Assuming 'district_wcis_by_year' has columns as years, the last column is the latest year\n",
                        "    # Ensure district_wcis_by_year is available (it was used in previous cells)\n",
                        "    if 'district_wcis_by_year' in locals():\n",
                        "        latest_year_col = district_wcis_by_year.columns[-1]\n",
                        "        \n",
                        "        # We need to map the latest WCI from district_wcis_by_year to gdf_predicted_state\n",
                        "        # Create a mapping series\n",
                        "        latest_wci_map = district_wcis_by_year[latest_year_col]\n",
                        "\n",
                        "        # Add 'Latest_Actual_WCI' to gdf_predicted_state by mapping DISTRICT\n",
                        "        # gdf_predicted_state already has 'DISTRICT' column standardized\n",
                        "        gdf_predicted_state['Latest_Actual_WCI'] = gdf_predicted_state['DISTRICT'].map(latest_wci_map)\n",
                        "\n",
                        "        # Fill NaNs with 0 (for safety)\n",
                        "        gdf_predicted_state['Latest_Actual_WCI'] = gdf_predicted_state['Latest_Actual_WCI'].fillna(0)\n",
                        "\n",
                        "        # Calculate Future Increase Chance (%)\n",
                        "        def calculate_increase_chance(row):\n",
                        "            actual = row['Latest_Actual_WCI']\n",
                        "            predicted = row['Predicted_WCI']\n",
                        "\n",
                        "            if actual == 0:\n",
                        "                if predicted > 0:\n",
                        "                    return 100.0\n",
                        "                else:\n",
                        "                    return 0.0\n",
                        "\n",
                        "            chance = ((predicted - actual) / actual) * 100\n",
                        "            return chance\n",
                        "\n",
                        "        gdf_predicted_state['Future_Increase_Chance'] = gdf_predicted_state.apply(calculate_increase_chance, axis=1)\n",
                        "        \n",
                        "        # Add Analysis Date (Current Time)\n",
                        "        now = datetime.now()\n",
                        "        analysis_date_str = now.strftime(\"%Y-%m-%d %H:%M:%S\")\n",
                        "        gdf_predicted_state['Analysis_Date'] = analysis_date_str\n",
                        "\n",
                        "        print(f\"Added 'Future_Increase_Chance' and 'Analysis_Date' ({analysis_date_str}) to gdf_predicted_state.\")\n",
                        "        \n",
                        "        # Display updated dataframe head\n",
                        "        display(gdf_predicted_state[['DISTRICT', 'Predicted_WCI', 'Latest_Actual_WCI', 'Future_Increase_Chance', 'Analysis_Date']].head())\n",
                        "    else:\n",
                        "        print(\"Warning: 'district_wcis_by_year' not found. Cannot calculate future increase chance.\")\n"
                    ]
                    
                    # Add simple "Predicted Year" variable logic back if it was replaced or just append
                    # The original cell ended with: predicted_year = gdf_predicted_state['Predicted_Year'].iloc[0]
                    # We can leave it or just append our code. Appending is safer.
                    
                    cell['source'].extend(new_code_snippet)
                    prediction_cell_found = True
                    break
        
        if not prediction_cell_found:
            print("Error: Could not find the Prediction Logic Cell.")
            return

        # 2. Update the Visualization Cell
        # Look for folium.Map and GeoJson
        viz_cell_found = False
        for cell in nb['cells']:
            if cell['cell_type'] == 'code':
                source_text = ''.join(cell['source'])
                if "folium.Map" in source_text and "folium.GeoJson" in source_text and "tooltip=" in source_text:
                    print("Found Visualization Cell.")
                    
                    # We need to replace specific parts of this cell's source code
                    # Since it's unstructured text, let's rewrite the cell content carefully
                    # We will reconstruct the critical parts:
                    # 1. df_map_predicted definition (add new columns)
                    # 2. Loop for properties (add new properties)
                    # 3. GeoJsonTooltip fields/aliases
                    
                    # Instead of complex string manipulation, let's replace the Logic for 'df_map_predicted' and 'tooltip' definition entirely
                    # We'll split the source into lines and look for patterns
                    
                    new_source = []
                    lines = source_text.splitlines(keepends=True)
                    
                    skip = False
                    
                    for line in lines:
                        # Update df_map_predicted columns
                        if "'Predicted_Future_Hotspot_LSTM'," in line:
                            new_source.append(line)
                            new_source.append("        'Future_Increase_Chance',\n")
                            new_source.append("        'Analysis_Date',\n")
                            continue
                        
                        # Update property loop assignments
                        if "feature['properties']['Predicted_Future_Hotspot_LSTM'] = bool(df_map_predicted.loc[standardized_district_name, 'Predicted_Future_Hotspot_LSTM'])" in line:
                            new_source.append(line)
                            new_source.append("            feature['properties']['Future_Increase_Chance'] = f\"{df_map_predicted.loc[standardized_district_name, 'Future_Increase_Chance']:.2f}%\"\n")
                            new_source.append("            feature['properties']['Analysis_Date'] = str(df_map_predicted.loc[standardized_district_name, 'Analysis_Date'])\n")
                            continue
                            
                        # Update else block assignments for properties
                        if "feature['properties']['Predicted_Future_Hotspot_LSTM'] = False" in line:
                            new_source.append(line)
                            new_source.append("            feature['properties']['Future_Increase_Chance'] = 'N/A'\n")
                            new_source.append("            feature['properties']['Analysis_Date'] = 'N/A'\n")
                            continue

                        # Update Tooltip
                        if "fields=['district', 'Predicted_WCI', 'Predicted_Hotspot_Category', 'Predicted_Future_Hotspot_LSTM']," in line:
                            new_source.append("            fields=['district', 'Predicted_WCI', 'Future_Increase_Chance', 'Predicted_Hotspot_Category', 'Predicted_Future_Hotspot_LSTM', 'Analysis_Date'],\n")
                            continue
                        
                        if "aliases=['District:', 'Predicted WCI:', 'Predicted Hotspot Category:', 'Predicted Future Hotspot (LSTM):']," in line:
                            new_source.append("            aliases=['District:', 'Predicted WCI:', 'Future Increase Chance:', 'Predicted Hotspot Category:', 'Predicted Future Hotspot (LSTM):', 'Analysis Date:'],\n")
                            continue
                            
                        new_source.append(line)
                    
                    cell['source'] = new_source
                    viz_cell_found = True
                    break
                    
        if not viz_cell_found:
            print("Error: Could not find the Visualization Cell.")
            return

        # Save the notebook
        with open(notebook_path, 'w', encoding='utf-8') as f:
            json.dump(nb, f, indent=1) # colab uses indentation 1 or 2, checking file... file viewed earlier had 2 spaces.
            # actually looking at view_file, it seems to be 1 space or just standard json dump.
            # modifying indent to 2 to match common format, or keep as is.
        
        print(f"Successfully updated notebook at {notebook_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    update_notebook()
